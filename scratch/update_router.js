const fs = require('fs');
let c = fs.readFileSync('apps/web/src/app/router.tsx', 'utf8');
c = c.replace(
  "import { AuditLogsPage } from '@/features/admin/AuditLogsPage';",
  "import { AuditCenterPage } from '@/features/audit/AuditCenterPage';"
);
c = c.replace(
  '<Route path="admin/audit-logs" element={<AuditLogsPage />} />',
  '<Route path="admin/audit-logs" element={<AuditCenterPage />} />'
);
fs.writeFileSync('apps/web/src/app/router.tsx', c, 'utf8');
console.log('Router updated.');
