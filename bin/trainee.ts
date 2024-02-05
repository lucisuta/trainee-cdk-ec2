#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TraineeStack } from '../lib/trainee-stack';

const app = new cdk.App();

// the stack is deployed to the default CLI configuration account id and region
// default account id taken from ~/.aws/credentials
// default region taken from ~/.aws/config
// https://docs.aws.amazon.com/cdk/latest/guide/environments.html

const props = {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: process.env.CDK_DEFAULT_REGION
	},
	gitHub: {
		oauthTokenSecretName: 'GitHubToken',
		repository: {
			name: 'trainee-frontend',
			owner: 'lucisuta',
			branch: 'main',
		}
	},
	keyPairName: 'TraineeKeyPair',
};

new TraineeStack(app, 'trainee', props);
