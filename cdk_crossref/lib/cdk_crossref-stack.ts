import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends cdk.Stack {
  readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, 'Vpc');
    this.vpc = vpc;
  }
}

export interface SecurityGroupStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class SecurityGroupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecurityGroupStackProps) {
    super(scope, id, props);
    
    new ec2.CfnSecurityGroup(this, 'SecurityGroup', {
      groupDescription: 'test security group',
      vpcId: props.vpc.vpcId,
    })
  }
}
