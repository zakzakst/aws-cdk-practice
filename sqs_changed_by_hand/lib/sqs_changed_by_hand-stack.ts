import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SqsChangedByHandStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const queue = new sqs.Queue(this, 'MyQueue', {
      queueName: 'test-queue-cdk',
      maxMessageSizeBytes: 8192,
    })
    cdk.Tags.of(queue).add('Name', 'test-queue-cdk');
  }
}
