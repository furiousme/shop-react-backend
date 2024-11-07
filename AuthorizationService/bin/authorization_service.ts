#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthorizationServiceStack } from '../lib/authorization_service-stack';
import { getConfig } from '../../config';

const config = getConfig();

const app = new cdk.App();
new AuthorizationServiceStack(app, 'AuthorizationServiceStack', {
  env: {
    region: config.REGION
  },
  config
});