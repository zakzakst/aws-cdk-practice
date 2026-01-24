import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface VpcStackProps extends cdk.StackProps {
  stage: string;
  cidr: string;
  enableNatGateway: boolean;
  oneNatGatewayPerAz: boolean;
}

export class VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const vpcCidrMask = Number(props.cidr.split('/')[1]);
    const subnetCidrMask = vpcCidrMask + 4;

    const subnetConfiguration: ec2.SubnetConfiguration[] = [
      {
        name: 'Public',
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: subnetCidrMask,
      },
      {
        name: 'Isolated',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: subnetCidrMask,
      },
      // enableNatGatewayがtrueのときのみPRIVATE_WITH_EGRESSのサブネットを追加
      ...(props.enableNatGateway ? [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: subnetCidrMask,
        }
      ]: []),
    ];
    const natGateways = props.enableNatGateway
      ? (props.oneNatGatewayPerAz ? 3 : 1)
      : 0;

    new ec2.Vpc(this, 'Vpc', {
      vpcName: `${props.stage}-vpc-cdk`,
      ipAddresses: ec2.IpAddresses.cidr(props.cidr),
      subnetConfiguration,
      natGateways,
    })
  }
}
