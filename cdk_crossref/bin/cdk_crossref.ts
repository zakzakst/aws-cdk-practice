#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib/core';
import { VpcStack, SecurityGroupStack } from '../lib/cdk_crossref-stack';

const app = new cdk.App();

const vpcStack = new VpcStack(app, 'VpcStack')
new SecurityGroupStack(app, 'SecurityGroupStack', {
  vpc: vpcStack.vpc,
});
