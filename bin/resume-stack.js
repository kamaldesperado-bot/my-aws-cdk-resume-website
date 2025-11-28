#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const resume_static_website_stack_1 = require("../lib/resume-static-website-stack");
const photo_album_stack_1 = require("../lib/photo-album-stack");
const learning_app_stack_1 = require("../lib/learning-app-stack");
const app = new cdk.App();
// Resume website stack
new resume_static_website_stack_1.ResumeStaticWebsiteStack(app, 'ResumeStaticWebsiteStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    description: 'CDK Stack for hosting a resume as a static website using S3 and CloudFront',
});
// Photo album website stack (separate)
new photo_album_stack_1.PhotoAlbumStack(app, 'PhotoAlbumStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    description: 'CDK Stack for photo album website with AWS-native image processing',
});
// Learning app stack
new learning_app_stack_1.LearningAppStack(app, 'LearningAppStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    description: 'CDK Stack for learning app with AI chat and YouTube suggestions',
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdW1lLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzdW1lLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsdUNBQXFDO0FBQ3JDLGlEQUFtQztBQUNuQyxvRkFBOEU7QUFDOUUsZ0VBQTJEO0FBQzNELGtFQUE2RDtBQUU3RCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQix1QkFBdUI7QUFDdkIsSUFBSSxzREFBd0IsQ0FBQyxHQUFHLEVBQUUsMEJBQTBCLEVBQUU7SUFDNUQsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQjtLQUN2QztJQUNELFdBQVcsRUFBRSw0RUFBNEU7Q0FDMUYsQ0FBQyxDQUFDO0FBRUgsdUNBQXVDO0FBQ3ZDLElBQUksbUNBQWUsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUU7SUFDMUMsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQjtLQUN2QztJQUNELFdBQVcsRUFBRSxvRUFBb0U7Q0FDbEYsQ0FBQyxDQUFDO0FBRUgscUJBQXFCO0FBQ3JCLElBQUkscUNBQWdCLENBQUMsR0FBRyxFQUFFLGtCQUFrQixFQUFFO0lBQzVDLEdBQUcsRUFBRTtRQUNILE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtRQUN4QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0I7S0FDdkM7SUFDRCxXQUFXLEVBQUUsaUVBQWlFO0NBQy9FLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBSZXN1bWVTdGF0aWNXZWJzaXRlU3RhY2sgfSBmcm9tICcuLi9saWIvcmVzdW1lLXN0YXRpYy13ZWJzaXRlLXN0YWNrJztcbmltcG9ydCB7IFBob3RvQWxidW1TdGFjayB9IGZyb20gJy4uL2xpYi9waG90by1hbGJ1bS1zdGFjayc7XG5pbXBvcnQgeyBMZWFybmluZ0FwcFN0YWNrIH0gZnJvbSAnLi4vbGliL2xlYXJuaW5nLWFwcC1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIFJlc3VtZSB3ZWJzaXRlIHN0YWNrXG5uZXcgUmVzdW1lU3RhdGljV2Vic2l0ZVN0YWNrKGFwcCwgJ1Jlc3VtZVN0YXRpY1dlYnNpdGVTdGFjaycsIHtcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTixcbiAgfSxcbiAgZGVzY3JpcHRpb246ICdDREsgU3RhY2sgZm9yIGhvc3RpbmcgYSByZXN1bWUgYXMgYSBzdGF0aWMgd2Vic2l0ZSB1c2luZyBTMyBhbmQgQ2xvdWRGcm9udCcsXG59KTtcblxuLy8gUGhvdG8gYWxidW0gd2Vic2l0ZSBzdGFjayAoc2VwYXJhdGUpXG5uZXcgUGhvdG9BbGJ1bVN0YWNrKGFwcCwgJ1Bob3RvQWxidW1TdGFjaycsIHtcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTixcbiAgfSxcbiAgZGVzY3JpcHRpb246ICdDREsgU3RhY2sgZm9yIHBob3RvIGFsYnVtIHdlYnNpdGUgd2l0aCBBV1MtbmF0aXZlIGltYWdlIHByb2Nlc3NpbmcnLFxufSk7XG5cbi8vIExlYXJuaW5nIGFwcCBzdGFja1xubmV3IExlYXJuaW5nQXBwU3RhY2soYXBwLCAnTGVhcm5pbmdBcHBTdGFjaycsIHtcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTixcbiAgfSxcbiAgZGVzY3JpcHRpb246ICdDREsgU3RhY2sgZm9yIGxlYXJuaW5nIGFwcCB3aXRoIEFJIGNoYXQgYW5kIFlvdVR1YmUgc3VnZ2VzdGlvbnMnLFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19