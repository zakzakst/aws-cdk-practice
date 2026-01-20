#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib/core';
import { SqsMultiEnvsStack } from '../lib/sqs_multi_envs-stack';
import { Stages, environmentProps } from '../lib/environments';

const stage = process.env.STAGE as Stages;
if (!stage) {
  throw new Error('STAGE is not defined');
}

const environment = environmentProps[stage];
if (!environment) {
  throw new Error(`Invalid stage: ${stage}`);
}

// const env: cdk.Environment = {
//   account: environment.account,
//   region: environment.region,
// }

const app = new cdk.App();
// new SqsMultiEnvsStack(app, `${stage}-SqsMultiEnvsStack1`, {
//   queueName: `${stage}-MyQueue1`,
//   env,
// });
// new SqsMultiEnvsStack(app, `${stage}-SqsMultiEnvsStack2`, {
//   queueName: `${stage}-MyQueue2`,
//   env,
// });

const st = new cdk.Stage(app, stage, {
  env: {
    account: environment.account,
    region: environment.region,
  }
})

new SqsMultiEnvsStack(st, 'SqsMultiStack1', {
  queueName: `${stage}-MyQueue1`
})
new SqsMultiEnvsStack(st, 'SqsMultiStack2', {
  queueName: `${stage}-MyQueue2`
})
