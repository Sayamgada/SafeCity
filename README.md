# SafeCity

## 1. Project Overview

SafeCity is an AI/ML-driven crime mapping and analytics platform designed to help law enforcement agencies better understand where crime is happening, when it is likely to occur, and how patrol resources can be deployed more effectively.

The system will link FIR data with other relevant policing inputs to identify crime hotspots, detect recurring patterns, and support proactive decision-making.

The project is timely because public safety teams are increasingly expected to do more with limited resources. By turning historical and live crime data into actionable insights, SafeCity can support faster response planning, improved patrol coverage, and stronger monitoring of accident-prone or sensitive locations.

## 2. Objectives

* Map crime incidents geographically to identify hotspots and high-risk zones.
* Analyze FIR and related data to uncover patterns, trends, and repeat-risk areas.
* Support predictive insights for better patrol planning and resource allocation.
* Improve monitoring of sensitive zones, accident-prone areas, and public safety concerns.
* Help police teams act more proactively rather than only responding after incidents occur.

Success will look like more efficient patrol deployment, clearer visibility into crime trends, and better-informed operational decisions for law enforcement agencies.

## 3. Scope & Deliverables

### Included in Scope

* A centralized platform for ingesting and organizing FIR data.
* Crime heatmaps, trend dashboards, and location-based analytics.
* AI/ML and statistical models to detect patterns and estimate high-risk areas.
* Patrol optimization recommendations based on risk levels and incident frequency.
* Monitoring views for crime-prone, accident-prone, and sensitive zones.

### Out of Scope

* Direct field enforcement actions or automated policing decisions without human review.
* Public-facing reporting of sensitive investigative data.
* Hardware procurement or installation of surveillance infrastructure.

### Main Deliverables

* Functional web-based crime mapping dashboard.
* Predictive analytics engine for hotspot identification.
* Patrol optimization and reporting module.
* Documentation for administrators and operational users.

## 4. Technology Stack

* **Framework:** Next.js `16.1.5` with App Router
* **Language:** TypeScript `5`
* **UI:** React `19.2.3`
* **Styling:** Tailwind CSS `4` with PostCSS
* **Database:** MongoDB with the official `mongodb` Node.js driver
* **Maps:** Leaflet and React-Leaflet with heatmaps and marker clustering
* **Charts:** Recharts
* **Analytics/ML:** Server-side TypeScript algorithms using `simple-statistics`
* **Analytics:** Risk scoring, hotspot clustering, crime classification, anomaly detection, patrol frequency scoring, and confidence scoring
* **Data Sources:** CSV dataset, MongoDB fallback, and generated mock data as the final fallback
* **Backend:** Next.js Server Components and API Route Handlers
* **Tooling:** ESLint 9 with Next.js rules, TypeScript compiler, and Node.js scripts
* **Fonts:** Geist through Next.js Google Fonts

## 5. Timeline & Milestones

* **Phase 1:** Data collection, validation, and requirement finalization
* **Phase 2:** Crime mapping framework and database setup
* **Phase 3:** AI/ML model development for hotspot prediction and pattern detection
* **Phase 4:** Dashboard design and patrol planning module development
* **Phase 5:** Testing, pilot deployment, and model refinement
* **Phase 6:** Full deployment and operational handover

The project is expected to progress iteratively, with feedback from policing stakeholders used to refine both the analytics and the user experience.

## 6. Stakeholders & Roles

* **Law enforcement agencies:** Primary users and decision-makers for patrol and response planning.
* **Data analysts / data science team:** Build models, validate insights, and monitor performance.
* **Software development team:** Design and maintain the platform, dashboard, and integrations.
* **GIS / mapping specialists:** Support spatial analysis and hotspot visualization.
* **Project sponsors / public safety leaders:** Define priorities, approve scope, and oversee outcomes.

The system is intended for internal use by police and public safety stakeholders who need reliable, data-backed situational awareness.

## 7. Additional Notes

* The platform will need strong attention to data quality, privacy, and access control.
* Human oversight is essential; predictive outputs should support, not replace, professional judgment.
* The system should be designed to handle sensitive data responsibly and avoid overreliance on historical bias in crime records.
* Integration with existing policing databases and GIS tools may be a key implementation consideration.

SafeCity is positioned to strengthen public safety operations by combining mapping, analytics, and predictive intelligence in one practical system.
