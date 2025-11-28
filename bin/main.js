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
const travel_bot_stack_1 = require("../lib/travel-bot-stack");
const app = new cdk.App();
new resume_static_website_stack_1.ResumeStaticWebsiteStack(app, 'ResumeStaticWebsiteStack');
new photo_album_stack_1.PhotoAlbumStack(app, 'PhotoAlbumStack');
new learning_app_stack_1.LearningAppStack(app, 'LearningAppStack');
new travel_bot_stack_1.TravelBotStack(app, 'TravelBotStack');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxpREFBbUM7QUFFbkMsb0ZBQThFO0FBQzlFLGdFQUEyRDtBQUMzRCxrRUFBNkQ7QUFDN0QsOERBQXlEO0FBRXpELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLElBQUksc0RBQXdCLENBQUMsR0FBRyxFQUFFLDBCQUEwQixDQUFDLENBQUM7QUFDOUQsSUFBSSxtQ0FBZSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQzVDLElBQUkscUNBQWdCLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDOUMsSUFBSSxpQ0FBYyxDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcblxuaW1wb3J0IHsgUmVzdW1lU3RhdGljV2Vic2l0ZVN0YWNrIH0gZnJvbSAnLi4vbGliL3Jlc3VtZS1zdGF0aWMtd2Vic2l0ZS1zdGFjayc7XG5pbXBvcnQgeyBQaG90b0FsYnVtU3RhY2sgfSBmcm9tICcuLi9saWIvcGhvdG8tYWxidW0tc3RhY2snO1xuaW1wb3J0IHsgTGVhcm5pbmdBcHBTdGFjayB9IGZyb20gJy4uL2xpYi9sZWFybmluZy1hcHAtc3RhY2snO1xuaW1wb3J0IHsgVHJhdmVsQm90U3RhY2sgfSBmcm9tICcuLi9saWIvdHJhdmVsLWJvdC1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5uZXcgUmVzdW1lU3RhdGljV2Vic2l0ZVN0YWNrKGFwcCwgJ1Jlc3VtZVN0YXRpY1dlYnNpdGVTdGFjaycpO1xubmV3IFBob3RvQWxidW1TdGFjayhhcHAsICdQaG90b0FsYnVtU3RhY2snKTtcbm5ldyBMZWFybmluZ0FwcFN0YWNrKGFwcCwgJ0xlYXJuaW5nQXBwU3RhY2snKTtcbm5ldyBUcmF2ZWxCb3RTdGFjayhhcHAsICdUcmF2ZWxCb3RTdGFjaycpO1xuXG4iXX0=