import React from "react";

// Lege staat van een overzicht (geen favorieten, niemand gevolgd, geen zoekresultaten, ...):
// gecentreerd icoon met uitleg en eventueel een knop, i.p.v. een losse regel tekst linksboven.
const EmptyState = ({ icon, children, actions, tone = "default" }: {
    icon: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    tone?: "default" | "error";
}) => (
    <div className={`empty-state ${tone === "error" ? "empty-state--error" : ""}`} role={tone === "error" ? "alert" : undefined}>
        <div className="empty-state-icon" aria-hidden="true">{icon}</div>
        <div className="empty-state-text">{children}</div>
        {actions && <div className="empty-state-actions">{actions}</div>}
    </div>
);

export default EmptyState;
