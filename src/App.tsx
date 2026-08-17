import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { hydrateApprovals } from "./approvals-store";
import { Shell } from "./layout";
import {
  AdmissionsPage,
  AdvancementPage,
  ApprovalsPage,
  ClassesPage,
  CockpitPage,
  PolicyPage,
  ReportsPage,
  ResourcesPage,
  StudentsPage,
  TeachersPage,
} from "./pages-main";
import { Class360Page, Student360Page, Teacher360Page } from "./pages-detail";
import { school } from "./school";

hydrateApprovals(school.approvals);

export function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<CockpitPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/class/:id" element={<Class360Page />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/student/:id" element={<Student360Page />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/teacher/:id" element={<Teacher360Page />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/admissions" element={<AdmissionsPage />} />
          <Route path="/advancement" element={<AdvancementPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
