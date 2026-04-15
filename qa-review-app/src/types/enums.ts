/**
 * Centralized Enum Definitions for Architect-Ready Logic
 * These mirrors the logical structure of the database Enums
 */

export enum Role {
    ADMIN = 'ADMIN',
    QA_HEAD = 'QA_HEAD',
    QA_MANAGER = 'QA_MANAGER',
    QA_ARCHITECT = 'QA_ARCHITECT',
    REVIEW_LEAD = 'REVIEW_LEAD',
    REVIEWER = 'REVIEWER',
    PM = 'PM',
    DEV_ARCHITECT = 'DEV_ARCHITECT',
    CONTACT_PERSON = 'CONTACT_PERSON',
    DIRECTOR = 'DIRECTOR'
}

export enum ProjectType {
    MANUAL = 'MANUAL',
    AUTOMATION_WEB = 'AUTOMATION_WEB',
    AUTOMATION_MOBILE = 'AUTOMATION_MOBILE',
    API = 'API',
    DESKTOP = 'DESKTOP'
}

export enum ProjectStatus {
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED'
}

export enum ReviewStatus {
    PENDING = 'PENDING',
    SCHEDULED = 'SCHEDULED',
    SUBMITTED = 'SUBMITTED',
    DEFERRED = 'DEFERRED',
    ON_HOLD = 'ON_HOLD',
    PROJECT_ENDED = 'PROJECT_ENDED',
    NOT_COMPLETED = 'NOT_COMPLETED'
}

export enum HealthStatus {
    ON_TRACK = 'On Track',
    SLIGHTLY_CHALLENGED = 'Slightly Challenged',
    EXTREMELY_CHALLENGED = 'Extremely Challenged',
    NA = 'N/A'
}
