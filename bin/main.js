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
const cdk = __importStar(require("aws-cdk-lib"));
const resume_static_website_stack_1 = require("../lib/resume-static-website-stack");
const photo_album_stack_1 = require("../lib/photo-album-stack");
const learning_app_stack_1 = require("../lib/learning-app-stack");
const app = new cdk.App();
new resume_static_website_stack_1.ResumeStaticWebsiteStack(app, 'ResumeStaticWebsiteStack');
new photo_album_stack_1.PhotoAlbumStack(app, 'PhotoAlbumStack');
new learning_app_stack_1.LearningAppStack(app, 'LearningAppStack');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxpREFBbUM7QUFFbkMsb0ZBQThFO0FBQzlFLGdFQUEyRDtBQUMzRCxrRUFBNkQ7QUFFN0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsSUFBSSxzREFBd0IsQ0FBQyxHQUFHLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztBQUM5RCxJQUFJLG1DQUFlLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDNUMsSUFBSSxxQ0FBZ0IsQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5cbmltcG9ydCB7IFJlc3VtZVN0YXRpY1dlYnNpdGVTdGFjayB9IGZyb20gJy4uL2xpYi9yZXN1bWUtc3RhdGljLXdlYnNpdGUtc3RhY2snO1xuaW1wb3J0IHsgUGhvdG9BbGJ1bVN0YWNrIH0gZnJvbSAnLi4vbGliL3Bob3RvLWFsYnVtLXN0YWNrJztcbmltcG9ydCB7IExlYXJuaW5nQXBwU3RhY2sgfSBmcm9tICcuLi9saWIvbGVhcm5pbmctYXBwLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbm5ldyBSZXN1bWVTdGF0aWNXZWJzaXRlU3RhY2soYXBwLCAnUmVzdW1lU3RhdGljV2Vic2l0ZVN0YWNrJyk7XG5uZXcgUGhvdG9BbGJ1bVN0YWNrKGFwcCwgJ1Bob3RvQWxidW1TdGFjaycpO1xubmV3IExlYXJuaW5nQXBwU3RhY2soYXBwLCAnTGVhcm5pbmdBcHBTdGFjaycpO1xuXG4iXX0=