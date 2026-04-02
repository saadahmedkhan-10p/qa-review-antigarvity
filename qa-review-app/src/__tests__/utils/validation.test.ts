/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';

describe('Password Hashing Utilities', () => {
    const testPassword = 'TestPassword123!';
    let hashedPassword: string;

    beforeEach(async () => {
        hashedPassword = await bcrypt.hash(testPassword, 10);
    });

    it('should hash passwords correctly', async () => {
        const hash = await bcrypt.hash(testPassword, 10);
        expect(hash).toBeDefined();
        expect(hash).not.toBe(testPassword);
        expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct passwords', async () => {
        const isValid = await bcrypt.compare(testPassword, hashedPassword);
        expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
        const isValid = await bcrypt.compare('WrongPassword', hashedPassword);
        expect(isValid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
        const hash1 = await bcrypt.hash(testPassword, 10);
        const hash2 = await bcrypt.hash(testPassword, 10);
        expect(hash1).not.toBe(hash2);

        // But both should verify correctly
        expect(await bcrypt.compare(testPassword, hash1)).toBe(true);
        expect(await bcrypt.compare(testPassword, hash2)).toBe(true);
    });

    it('should handle empty password', async () => {
        const hash = await bcrypt.hash('', 10);
        expect(await bcrypt.compare('', hash)).toBe(true);
        expect(await bcrypt.compare('notempty', hash)).toBe(false);
    });

    it('should handle special characters in passwords', async () => {
        const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const hash = await bcrypt.hash(specialPassword, 10);
        expect(await bcrypt.compare(specialPassword, hash)).toBe(true);
    });
});

describe('Role Validation', () => {
    it('should parse valid role JSON', () => {
        const rolesJson = '["ADMIN","LEAD"]';
        const roles = JSON.parse(rolesJson);
        expect(roles).toEqual(['ADMIN', 'LEAD']);
        expect(roles).toContain('ADMIN');
        expect(roles).toContain('LEAD');
    });

    it('should handle single role', () => {
        const rolesJson = '["REVIEWER"]';
        const roles = JSON.parse(rolesJson);
        expect(roles).toEqual(['REVIEWER']);
        expect(roles.length).toBe(1);
    });

    it('should handle empty roles array', () => {
        const rolesJson = '[]';
        const roles = JSON.parse(rolesJson);
        expect(roles).toEqual([]);
        expect(roles.length).toBe(0);
    });

    it('should check if user has admin role', () => {
        const rolesJson = '["ADMIN","LEAD"]';
        const roles = JSON.parse(rolesJson);
        const isAdmin = roles.includes('ADMIN');
        expect(isAdmin).toBe(true);
    });

    it('should check if user does not have admin role', () => {
        const rolesJson = '["LEAD","REVIEWER"]';
        const roles = JSON.parse(rolesJson);
        const isAdmin = roles.includes('ADMIN');
        expect(isAdmin).toBe(false);
    });
});

describe('Form Questions Parsing', () => {
    it('should parse form questions correctly', () => {
        const questionsJson = '[{"text":"Question 1","type":"text"},{"text":"Question 2","type":"radio","options":["Yes","No"]}]';
        const questions = JSON.parse(questionsJson);

        expect(questions).toHaveLength(2);
        expect(questions[0].text).toBe('Question 1');
        expect(questions[0].type).toBe('text');
        expect(questions[1].options).toEqual(['Yes', 'No']);
    });

    it('should handle empty questions array', () => {
        const questionsJson = '[]';
        const questions = JSON.parse(questionsJson);
        expect(questions).toEqual([]);
    });

    it('should handle checkbox type questions', () => {
        const questionsJson = '[{"text":"Select all","type":"checkbox","options":["A","B","C"]}]';
        const questions = JSON.parse(questionsJson);

        expect(questions[0].type).toBe('checkbox');
        expect(questions[0].options).toHaveLength(3);
    });
});

describe('Date Validation', () => {
    it('should validate future dates', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);

        const now = new Date();
        expect(futureDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should validate past dates', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);

        const now = new Date();
        expect(pastDate.getTime()).toBeLessThan(now.getTime());
    });

    it('should format dates correctly', () => {
        const date = new Date('2024-01-15');
        const formatted = date.toLocaleDateString();
        expect(formatted).toBeDefined();
        expect(typeof formatted).toBe('string');
    });
});

describe('Email Validation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('should validate correct email format', () => {
        expect(emailRegex.test('user@example.com')).toBe(true);
        expect(emailRegex.test('test.user@company.co.uk')).toBe(true);
        expect(emailRegex.test('admin+tag@domain.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
        expect(emailRegex.test('invalid')).toBe(false);
        expect(emailRegex.test('no@domain')).toBe(false);
        expect(emailRegex.test('@nodomain.com')).toBe(false);
        expect(emailRegex.test('spaces in@email.com')).toBe(false);
    });
});
