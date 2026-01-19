import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface SqsMultiEnvsStackProps extends cdk.StackProps {
  queueName: string;
}

export class SqsMultiEnvsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SqsMultiEnvsStackProps) {
    super(scope, id, props);
    
    new sqs.Queue(this, 'Queue', {
      queueName: props.queueName,
    })
  }
}
