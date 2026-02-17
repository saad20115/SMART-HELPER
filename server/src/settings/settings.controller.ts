import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    // Branches
    @Get('branches')
    async getBranches(@Query('companyId') companyId?: string) {
        return this.settingsService.getBranches(companyId);
    }

    @Post('branches')
    async createBranch(@Body() data: { name: string; companyId: string }) {
        return this.settingsService.createBranch(data);
    }

    @Put('branches/:id')
    async updateBranch(@Param('id') id: string, @Body() data: { name: string }) {
        return this.settingsService.updateBranch(id, data.name);
    }

    @Delete('branches/:id')
    async deleteBranch(@Param('id') id: string) {
        return this.settingsService.deleteBranch(id);
    }

    // Jobs
    @Get('jobs')
    async getJobs(@Query('companyId') companyId?: string) {
        return this.settingsService.getJobs(companyId);
    }

    @Post('jobs')
    async createJob(@Body() data: { name: string; companyId: string }) {
        return this.settingsService.createJob(data);
    }

    @Put('jobs/:id')
    async updateJob(@Param('id') id: string, @Body() data: { name: string }) {
        return this.settingsService.updateJob(id, data.name);
    }

    @Delete('jobs/:id')
    async deleteJob(@Param('id') id: string) {
        return this.settingsService.deleteJob(id);
    }

    // Classifications
    @Get('classifications')
    async getClassifications(@Query('companyId') companyId?: string) {
        return this.settingsService.getClassifications(companyId);
    }

    @Post('classifications')
    async createClassification(@Body() data: { name: string; companyId: string }) {
        return this.settingsService.createClassification(data);
    }

    @Put('classifications/:id')
    async updateClassification(@Param('id') id: string, @Body() data: { name: string }) {
        return this.settingsService.updateClassification(id, data.name);
    }

    @Delete('classifications/:id')
    async deleteClassification(@Param('id') id: string) {
        return this.settingsService.deleteClassification(id);
    }
}
