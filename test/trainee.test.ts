import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TraineeStack } from '../lib/ec2/trainee-stack';

test('Pipeline Created', () => {
	const app = new cdk.App();

	const stack = new TraineeStack(app, 'TestStack', {
		gitHub: {
			oauthTokenSecretName: 'TBD',
			repository: {
				name: '',
				owner: '',
				branch: '',
			}
		},
		keyPairName: ''
	});

	const template = Template.fromStack(stack);
	template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
		Tags: [{ Key: 'app:name', Value: 'trainee' }],
	});
});
