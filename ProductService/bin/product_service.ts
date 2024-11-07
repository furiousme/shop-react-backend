#!/usr/bin/env node
import 'source-map-support/register';
import { getConfig } from './../../config';
import * as cdk from 'aws-cdk-lib';
import { ProductServiceStack } from '../lib/product_service-stack';

const config = getConfig();

const app = new cdk.App();
new ProductServiceStack(app, 'ProductServiceStack', {
  env: {
    region: config.REGION
  },
  config
});