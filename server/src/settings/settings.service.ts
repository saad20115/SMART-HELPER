import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Branches
  async getBranches(companyId?: string) {
    if (!companyId) return [];
    return this.prisma.branch.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async createBranch(data: { name: string; companyId: string }) {
    return this.prisma.branch.create({
      data,
    });
  }

  async updateBranch(id: string, name: string) {
    return this.prisma.branch.update({
      where: { id },
      data: { name },
    });
  }

  async deleteBranch(id: string) {
    return this.prisma.branch.delete({
      where: { id },
    });
  }

  // Jobs
  async getJobs(companyId?: string) {
    if (!companyId) return [];
    return this.prisma.job.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async createJob(data: { name: string; companyId: string }) {
    return this.prisma.job.create({
      data,
    });
  }

  async updateJob(id: string, name: string) {
    return this.prisma.job.update({
      where: { id },
      data: { name },
    });
  }

  async deleteJob(id: string) {
    return this.prisma.job.delete({
      where: { id },
    });
  }

  // Classifications
  async getClassifications(companyId?: string) {
    if (!companyId) return [];
    return this.prisma.classification.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async createClassification(data: { name: string; companyId: string }) {
    return this.prisma.classification.create({
      data,
    });
  }

  async updateClassification(id: string, name: string) {
    return this.prisma.classification.update({
      where: { id },
      data: { name },
    });
  }

  async deleteClassification(id: string) {
    return this.prisma.classification.delete({
      where: { id },
    });
  }
}
