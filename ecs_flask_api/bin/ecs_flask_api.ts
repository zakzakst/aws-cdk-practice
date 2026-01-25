#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib/core';
import { EcsFlaskApiInfraStack } from '../lib/ecs_flask_api_infra-stack';
import { EcsFlaskApiStack } from '../lib/ecs_flask_api-stack';
import { environmentProps, Stages } from '../lib/environments';

const stage = process.env.STAGE as Stages;
if (!stage) {
  throw new Error('STAGE is not defied')
}

const environment = environmentProps[stage];
if (!environment) {
  throw new Error(`Invalid stage: ${stage}`)
}

const app = new cdk.App();
const st = new cdk.Stage(app, stage, {
  env: {
    account: environment.account,
    region: 'ap-northeast-1'
  }
})
const infraStack = new EcsFlaskApiInfraStack(st, 'EcsFlaskApiInfraStack', {
  stage
})

new EcsFlaskApiStack(st, 'EcsFlaskApiStack', {
  stage,
  repositoryName: infraStack.repositoryName,
  secretsName: infraStack.secretsName
});
