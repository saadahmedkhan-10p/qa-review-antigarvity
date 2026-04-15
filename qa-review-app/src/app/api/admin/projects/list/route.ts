import { NextResponse } from 'next/server';
import { ProjectService } from '@/services/projectService';
import { withErrorHandler } from '@/lib/apiErrorHandler';

/**
 * Standardized Project List API
 */
export const GET = withErrorHandler(async () => {
    // We use a simplified fetch here for lightweight selection,
    // but we could also use ProjectService.getAll() if full relations were needed.
    const projects = await ProjectService.getAll();
    
    // Architect preference: Return only what's needed for the consumer
    const simplified = projects.map(p => ({
        id: p.id,
        name: p.name
    }));

    return NextResponse.json(simplified);
}, { requiredRole: ['ADMIN', 'QA_HEAD', 'QA_MANAGER', 'QA_ARCHITECT'] });
