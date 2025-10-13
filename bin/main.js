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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxpREFBbUM7QUFDbkMsb0ZBQThFO0FBQzlFLGdFQUEyRDtBQUMzRCxrRUFBNkQ7QUFFN0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsSUFBSSxzREFBd0IsQ0FBQyxHQUFHLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztBQUM5RCxJQUFJLG1DQUFlLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDNUMsSUFBSSxxQ0FBZ0IsQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBSZXN1bWVTdGF0aWNXZWJzaXRlU3RhY2sgfSBmcm9tICcuLi9saWIvcmVzdW1lLXN0YXRpYy13ZWJzaXRlLXN0YWNrJztcbmltcG9ydCB7IFBob3RvQWxidW1TdGFjayB9IGZyb20gJy4uL2xpYi9waG90by1hbGJ1bS1zdGFjayc7XG5pbXBvcnQgeyBMZWFybmluZ0FwcFN0YWNrIH0gZnJvbSAnLi4vbGliL2xlYXJuaW5nLWFwcC1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5uZXcgUmVzdW1lU3RhdGljV2Vic2l0ZVN0YWNrKGFwcCwgJ1Jlc3VtZVN0YXRpY1dlYnNpdGVTdGFjaycpO1xubmV3IFBob3RvQWxidW1TdGFjayhhcHAsICdQaG90b0FsYnVtU3RhY2snKTtcbm5ldyBMZWFybmluZ0FwcFN0YWNrKGFwcCwgJ0xlYXJuaW5nQXBwU3RhY2snKTtcbiJdfQ==