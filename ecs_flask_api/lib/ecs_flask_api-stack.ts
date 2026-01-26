import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';

interface EcsFlaskApiStackProps extends cdk.StackProps {
  stage: string;
  repositoryName: string;
  secretsName: string;
}

export class EcsFlaskApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsFlaskApiStackProps) {
    super(scope, id, props);

    // 既存のVPCを参照
    const vpc = ec2.Vpc.fromLookup(this, 'EcsFlaskApiVpc', {
      vpcName: `${props.stage}-vpc-tf`,
    })

    // 既存のシークレットを参照
    const secrets = sm.Secret.fromSecretNameV2(
      this,
      'EcsFlaskApiSecrets',
      props.secretsName
    )

    // 既存のリポジトリを参照
    const repository = ecr.Repository.fromRepositoryName(
      this,
      'EcsFlaskApiRepository',
      props.repositoryName
    )

    const cluster = new ecs.Cluster(this, 'EcsFlaskApiCluster', {
      clusterName: `${props.stage}-flask-api-cdk`,
      enableFargateCapacityProviders: true,
      vpc
    })

    // ALBを記述
    const alb = new elbv2.ApplicationLoadBalancer(this, 'EcsFlaskApiAlb', {
      loadBalancerName: `${props.stage}-flask-api-alb-cdk`,
      vpc,
      internetFacing: true,
      // セキュリティグループを自動作成しない場合は、albSecurityGroupを記述してコメントインする
      // securityGroup: albSecurityGroup,
    })

    // ALBのターゲットグループを記述
    const defaultTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'EcsFlaskApiTargetGroup',
      {
        targetGroupName: `${props.stage}-flask-api-cdk`,
        vpc,
        port: 5000,
        // ECSでALBを使う場合にはターゲットタイプをIPにする
        targetType: elbv2.TargetType.IP,
        protocol: elbv2.ApplicationProtocol.HTTP,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(10),
          healthyHttpCodes: '200',
        }
      }
    )

    // ALBに80番ポートへの通信を受け付けるリスナーを追加
    alb.addListener('EcsFlaskApiAlbListener', {
      port: 80,
      open: true,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([defaultTargetGroup])
    })

    const executionRole = new iam.Role(this, 'EcsFlaskApiTaskExecRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: `${props.stage}-flask-api-execution-role-cdk`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        )
      ]
    })

    const taskRole = new iam.Role(this, 'EcsFlaskApiTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: `${props.stage}-flask-api-task-role-cdk`
    })

    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      'EcsFlaskApiAlbSecurityGroup',
      {
        vpc,
        securityGroupName: `${props.stage}-flask-api-alb-sg-cdk`,
        // これを入れておかないと、アウトバウンドのすべての通信が許可されるので注意
        allowAllOutbound: false,
      }
    )

    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      'EcsFlaskApiEcsSecurityGroup',
      {
        vpc,
        securityGroupName: `${props.stage}-flask-api-ecs-sg-cdk`,
        allowAllOutbound: false,
      }
    )

    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

    albSecurityGroup.addEgressRule(ecsSecurityGroup, ec2.Port.tcp(5000))

    ecsSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(5000))

    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443))
    
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'EcsFlaskApiTaskDefinition',
      {
        cpu: 256,
        memoryLimitMiB: 512,
        // ECSタスク実行ロールを自動作成しない場合は、executionRoleを記述してコメントインする
        // executionRole,
        // ECSタスクを自動作成しない場合は、taskRoleを記述してコメントインする
        // taskRole,
        family: `${props.stage}-flask-api-cdk`,
      }
    )

    const queue = new sqs.Queue(this, 'EcsTaskQueue');

    taskDefinition.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['sqs:SendMessage'],
        resources: [queue.queueArn],
      })
    )

    queue.grantSendMessages(taskDefinition.taskRole)

    // ECSタスクのロググループを作成
    const logGroup = new logs.LogGroup(this, 'EcsFlaskApiLogGroup', {
      logGroupName: `/ecs/${props.stage}-flask-api-cdk`,
      retention: logs.RetentionDays.THIRTEEN_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // タスク定義にコンテナを追加
    taskDefinition.addContainer('EcsFlaskApi', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      // 環境変数
      // SSMパラメータストアやSecrets Managerから取得する値を設定
      secrets: {
        CORRECT_ANSWER: ecs.Secret.fromSecretsManager(secrets),
      },
      portMappings: [
        {
          containerPort: 5000,
          hostPort: 5000,
        }
      ],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'flask-api',
        logGroup,
      })
    })

    // ECSサービスを記述
    const service = new ecs.FargateService(this, 'EcsFlaskApiService', {
      serviceName: 'flask-api-cdk',
      cluster,
      taskDefinition,
      // リソースの作成時にタスクが起動しないようにしておく。あとで手動で起動する
      desiredCount: 0,
      // セキュリティグループを自動作成しない場合は、ecsSecurityGroupを記述してコメントインする
      // securityGroups: [ecsSecurityGroups],
      // パブリックサブネットに配置するので、trueにする
      // これをtrueにすることで、ECSタスクはパブリックサブネットに配置される
      assignPublicIp: true,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      // サーキットブレーカーを有効にする
      circuitBreaker: {
        enable: true,
        rollback: false,
      },
      // ECS Execでコンテナに接続できるようにする
      enableExecuteCommand: true,
    })

    // ECSサービスをALBのターゲットグループに登録する
    service.attachToApplicationTargetGroup(defaultTargetGroup);
  }
}
