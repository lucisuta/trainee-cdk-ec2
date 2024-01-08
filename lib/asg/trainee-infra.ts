import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as asg from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface TraineeInfrastructureProps {
	keyPairName: string
}

export class TraineeInfrastructure extends Construct {
	public readonly autoScalingGroup: asg.AutoScalingGroup;

	constructor(scope: Construct, id: string, props: TraineeInfrastructureProps) {
		super(scope, id);

		// create a new VPC for all resources in this construct
		// stop it from creating NAT gateways in public subnets which are not necessary in our scenario
		const vpc = new ec2.Vpc(this, 'trainee-vpc-asg', {
			vpcName: 'trainee-vpc-asg',
			natGateways: 0,
		});

		// security group for instances
		const sg = new ec2.SecurityGroup(this, 'trainee-sg-asg', {
			securityGroupName: 'trainee-sg-asg',
			vpc: vpc,
			allowAllOutbound: true,
		});

		// allow access to ports 22 and 8080 from anywhere
		sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH from anywhere');
		sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Allow test HTTP from anywhere');

		// configure a role for instances to allow them to run CodeDeploy agent
		const instanceRole = new iam.Role(this, 'trainee-instance-role-asg', {
			roleName: 'trainee-instance-role-asg',
			assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforAWSCodeDeploy')
			]
		});

		// template used to launch EC2 instances to run our code
		const template = new ec2.LaunchTemplate(this, 'trainee-launch-template-asg', {
			launchTemplateName: "trainee-asg",
			instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
			machineImage: ec2.MachineImage.genericLinux({
				'eu-north-1': 'ami-0fe8bec493a81c7da'
			}),
			keyName: props.keyPairName,
			securityGroup: sg,
			instanceMetadataTags: true,
			requireImdsv2: true,
			httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
			role: instanceRole,
		})

		this.autoScalingGroup = new asg.AutoScalingGroup(this, 'trainee-auto-scaling-group-asg', {
			vpc: vpc,
			vpcSubnets: {
				subnets: vpc.publicSubnets
			},
			launchTemplate: template,
			maxCapacity: 1,
			minCapacity: 1,
		})
	}
}
