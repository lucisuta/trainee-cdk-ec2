import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface TraineeInfrastructureProps {
	keyPairName: string
}

export class TraineeInfrastructure extends Construct {
	constructor(scope: Construct, id: string, props: TraineeInfrastructureProps) {
		super(scope, id);

		// create a new VPC for all resources in this construct
		// stop it from creating NAT gateways in public subnets which are not necessary in our scenario
		const vpc = new ec2.Vpc(this, 'trainee-vpc', {
			vpcName: 'trainee-vpc',
			natGateways: 0,
		});

		// security group for instances
		const sg = new ec2.SecurityGroup(this, 'trainee-sg', {
			securityGroupName: 'trainee-sg',
			vpc: vpc,
			allowAllOutbound: true,
		});

		// allow access to ports 22 and 8080 from anywhere
		sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH from anywhere');
		sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Allow test HTTP from anywhere');

		// configure a role for instances to allow them to run CodeDeploy agent
		const instanceRole = new iam.Role(this, 'trainee-instance-role', {
			roleName: 'trainee-instance-role',
			assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforAWSCodeDeploy')
			]
		});

		// commands to run after the EC2 instance is started: install the CodeDeploy user agent
		const userData = ec2.UserData.forLinux({ shebang: '#!/bin/bash -xe' });
		userData.addCommands(
			'sudo apt update',
			'sudo apt install -y ruby-full',
			'sudo apt install -y wget',
			'sudo apt install -y jq',
			'TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`',
			'REGION=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r ".region")',
			'cd /home/ubuntu',
			'sudo wget https://aws-codedeploy-${REGION}.s3.amazonaws.com/latest/install',
			'sudo chmod +x ./install',
			'sudo ./install auto > /tmp/logfile',
		);

		// template used to launch EC2 instances to run our code
		const template = new ec2.LaunchTemplate(this, 'trainee-launch-template', {
			launchTemplateName: 'trainee',
			instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
			machineImage: ec2.MachineImage.genericLinux({
				'eu-north-1': 'ami-0fe8bec493a81c7da'
			}),
			userData: userData,
			keyName: props.keyPairName,
			securityGroup: sg,
			instanceMetadataTags: true,
			requireImdsv2: true,
			httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
			role: instanceRole,
		})
	}
}
