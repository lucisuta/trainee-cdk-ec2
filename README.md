# Trainee CDK

CDK backend to automatically build and deploy
the [trainee-frontend](http://github.com/lucisuta/trainee-frontend) demo application
to different AWS compute configurations.

Demonstrates how to use
[CodePipeline](https://aws.amazon.com/codepipeline/),
[CodeBuild](https://aws.amazon.com/codebuild/),
and [CodeDeploy](https://aws.amazon.com/codedeploy/).

### Stacks

There are two stacks for two different infrastructure configurations for compute

* `lib/ec2` Tagged EC2 instances
* `lib/asg` Autoscaling group

### Stages

The pipeline has three stages

* **Source** - Get the source code from the GitHub repository
* **Build** - Build the code using the `buildspec.yml` configuration in the repository
* **Deploy** - Deploy the code using the `appspec.yml` configuration in the repository

### Prerequisites

01. Install AWS CLI

02. Login in to your AWS account using the CLI

    Your credentials should be saved in `~/.aws/credentials`
    and default region in `~/.aws/config`  

03. Install CDK

04. Bootstrap CDK environment

    Run the `cdk bootstrap` command to make the specified region usable by CDK.
 
05. Generate GitHub OAuth token

    The token should have `repo` and `admin:repo_hook` permissions.

06. Save token in Secret Manager

    Use the name specified in `bin/trainee.ts`.

07. Create EC2 key pair

    Use the key pair name specified in `bin/trainee.ts`.
    This key pair will automatically be associated with instances that are created
    by the stack and will allow you to access them using SSH.

### Configuration

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### CDK Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
