import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface SqsImportTestStackProps extends cdk.StackProps {
}

export class SqsImportTestStack extends cdk.Stack {
  public constructor(scope: cdk.App, id: string, props: SqsImportTestStackProps = {}) {
    super(scope, id, props);

    // Resources
    const sqsQueueTestqueuecdk2 = new sqs.CfnQueue(this, 'SQSQueueTestqueuecdk2', {
      sqsManagedSseEnabled: true,
      receiveMessageWaitTimeSeconds: 0,
      delaySeconds: 0,
      messageRetentionPeriod: 345600,
      maximumMessageSize: 1048576,
      visibilityTimeout: 30,
      queueName: 'test-queue-cdk-2',
    });
    sqsQueueTestqueuecdk2.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
  }
}
