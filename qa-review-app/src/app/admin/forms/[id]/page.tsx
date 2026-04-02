"use client";
import { use } from "react";

export default function FormDebugPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <div>Form ID: {id}</div>;
}
