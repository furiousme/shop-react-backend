#!/usr/bin/env node
import { getConfig } from './../../config';
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ImportServiceStack } from '../lib/import_service-stack';

const config = getConfig();

const app = new cdk.App();
new ImportServiceStack(app, 'ImportServiceStack', {
  env: {
    region: config.REGION
  },
  config
});