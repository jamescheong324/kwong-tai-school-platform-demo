import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./layout";
import {
  AdmissionsPage,
  AdvancementPage,
  ClassesPage,
  CockpitPage,
  ReportsPage,
  ResourcesPage,
  StudentsPage,
  TeachersPage,
} from "./pages-main";
import { PolicyPage, SchedulePage } from "./pages-agent";
import { Class360Page, Student360Page, Teacher360Page } from "./pages-detail";
import { hydrateTimetable } from "./timetable-store";

hydrateTimetable();

export function App() {
  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<CockpitPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/class/:id" element={<Class360Page />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/student/:id" element={<Student360Page />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/teacher/:id" element={<Teacher360Page />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/approvals" element={<Navigate to="/schedule" replace />} />
          <Route path="/admissions" element={<AdmissionsPage />} />
          <Route path="/advancement" element={<AdvancementPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </HashRouter>
  );
}
