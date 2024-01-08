import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cp from 'aws-cdk-lib/aws-codepipeline';
import * as cpa from 'aws-cdk-lib/aws-codepipeline-actions';
import * as cb from 'aws-cdk-lib/aws-codebuild';
import * as cd from 'aws-cdk-lib/aws-codedeploy';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as asg from 'aws-cdk-lib/aws-autoscaling';
// import * as iam from 'aws-cdk-lib/aws-iam';
import { TraineeGitHubProps } from '../trainee-props';

export interface TraineePipelineProps {
	gitHub: TraineeGitHubProps
	autoScalingGroup: asg.AutoScalingGroup
}

export class TraineePipeline extends Construct {
	constructor(scope: Construct, id: string, props: TraineePipelineProps) {
		super(scope, id);

		// PIPELINE

		const artifactBucket = new s3.Bucket(this, "trainee-artifact-bucket-asg", {
			bucketName: "trainee-artifact-bucket-asg",
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});

		const pipeline = new cp.Pipeline(this, 'trainee-pipeline-asg', {
			pipelineName: "trainee-pipeline-asg",
			artifactBucket: artifactBucket,
		});

		// SOURCE STAGE

		const sourceOutput = new cp.Artifact("trainee-source-artifact-asg");
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

		const buildOutput = new cp.Artifact("trainee-build-artifact-asg");

		const buildProject = new cb.PipelineProject(this, "trainee-project-asg", {
			projectName: "trainee-project-asg",
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

		const application = new cd.ServerApplication(this, "trainee-application-asg", {
			applicationName: "trainee-application-asg"
		});

		// example of how to override a role in the pipeline
		// const deploymentRole = new iam.Role(this, 'trainee-deployment-role-ec2', {
		// 	roleName: 'TraineeDeployRole',
		// 	assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
		// 	managedPolicies: [
		// 		iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRole')
		// 	]
		// });

		const deploymentGroup = new cd.ServerDeploymentGroup(this, "trainee-deployment-group-asg", {
			deploymentGroupName: "trainee-deployment-group-asg",
			application: application,
			deploymentConfig: cd.ServerDeploymentConfig.ONE_AT_A_TIME,
			installAgent: true,
			autoScalingGroups: [props.autoScalingGroup],
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
