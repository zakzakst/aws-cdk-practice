#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { SqsMultiStack } from '../lib/sqs_multi-stack';

const app = new cdk.App();
new SqsMultiStack(app, 'SqsMultiStack1', {
  env: {
    // account: 'hogehoge',
    region: 'ap-northeast-1'
  },
  queueName: 'MyQueue1'
});
new SqsMultiStack(app, 'SqsMultiStack2', {
  queueName: 'MyQueue2'
});
