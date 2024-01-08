#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TraineeStack as TraineeStackEc2 } from '../lib/ec2/trainee-stack';
import { TraineeStack as TraineeStackAsg } from '../lib/asg/trainee-stack';

const app = new cdk.App();

// the stack is deployed to the default CLI configuration account id and region
// default account id taken from ~/.aws/credentials
// default region taken from ~/.aws/config
// https://docs.aws.amazon.com/cdk/latest/guide/environments.html

const props = {
	env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
	gitHub: {
		oauthTokenSecretName: "GitHubToken",
		repository: {
			name: "trainee-frontend",
			owner: "lucisuta",
			branch: "main",
		}
	},
	keyPairName: 'TraineeKeyPair',
};

// simple EC2 deployment stack
new TraineeStackEc2(app, 'ec2', props);

// autoscaling group deployment stack
new TraineeStackAsg(app, 'asg', props);
