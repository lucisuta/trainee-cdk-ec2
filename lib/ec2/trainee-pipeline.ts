import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cp from 'aws-cdk-lib/aws-codepipeline';
import * as cpa from 'aws-cdk-lib/aws-codepipeline-actions';
import * as cb from 'aws-cdk-lib/aws-codebuild';
import * as cd from 'aws-cdk-lib/aws-codedeploy';
import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as iam from 'aws-cdk-lib/aws-iam';
import { TraineeGitHubProps } from '../trainee-props';

export interface TraineePipelineProps {
	gitHub: TraineeGitHubProps
}

export class TraineePipeline extends Construct {
	constructor(scope: Construct, id: string, props: TraineePipelineProps) {
		super(scope, id);

		// PIPELINE

		const artifactBucket = new s3.Bucket(this, "trainee-artifact-bucket-ec2", {
			bucketName: "trainee-artifact-bucket-ec2",
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});

		const pipeline = new cp.Pipeline(this, 'trainee-pipeline-ec2', {
			pipelineName: "trainee-pipeline-ec2",
			artifactBucket: artifactBucket,
		});

		// SOURCE STAGE

		const sourceOutput = new cp.Artifact("trainee-source-artifact-ec2");
		const oauthToken = cdk.SecretValue.secretsManager(props.gitHub.oauthTokenSecretName);
		const sourceAction = new cpa.GitHubSourceAction({
			actionName: "GetCode",
			repo: props.gitHub.repository.name,
			branch: props.gitHub.repository.branch,
			owner: props.gitHub.repository.owner,
			oauthToken: oauthToken,
			output: sourceOutput
		});

		pipeline.addStage({
			stageName: "Source",
			actions: [sourceAction]
		});

		// BUILD STAGE

		const buildOutput = new cp.Artifact("trainee-build-artifact-ec2");

		const buildProject = new cb.PipelineProject(this, "trainee-project-ec2", {
			projectName: "trainee-project-ec2",
			environment: {
				buildImage: cb.LinuxBuildImage.fromDockerRegistry("swift:5.9-jammy")
			}
		});

		const buildAction = new cpa.CodeBuildAction({
			actionName: "BuildCode",
			input: sourceOutput,
			outputs: [buildOutput],
			project: buildProject,
		});

		pipeline.addStage({
			stageName: "Build",
			actions: [buildAction]
		});

		// DEPLOY STAGE

		const application = new cd.ServerApplication(this, "trainee-application-ec2", {
			applicationName: "TraineeApplicationEC2"
		});

		// example of how to override a role in the pipeline
		// const deploymentRole = new iam.Role(this, 'trainee-deployment-role-ec2', {
		// 	roleName: 'TraineeDeployRole',
		// 	assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
		// 	managedPolicies: [
		// 		iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRole')
		// 	]
		// });

		const deploymentGroup = new cd.ServerDeploymentGroup(this, "trainee-deployment-group-ec2", {
			deploymentGroupName: "trainee-deployment-group-ec2",
			application: application,
			deploymentConfig: cd.ServerDeploymentConfig.ONE_AT_A_TIME,
			installAgent: false, // we will use launch template user data to install agent
			ec2InstanceTags: new cd.InstanceTagSet({ 'app:name': ['trainee'] }),
			// role: deploymentRole,
		});

		const deployAction = new cpa.CodeDeployServerDeployAction({
			actionName: "DeployCode",
			input: buildOutput,
			deploymentGroup: deploymentGroup,
		});

		pipeline.addStage({
			stageName: "Deploy",
			actions: [deployAction]
		});
	}
}
