export interface TraineeGitHubProps {

	/** The name of the secret in AWS Secrets Manager where the GitHub OAuth token is kept */
	oauthTokenSecretName: string

	/** Information about the GitHub repository containing the code to be deployed */
	repository: {

		/** Name of the repository */
		name: string

		/** User account or organization name that owns the repository */
		owner: string

		/** Branch to be used for deployment */
		branch: string
	}
}
