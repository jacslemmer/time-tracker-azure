// This file consolidates all Azure Functions for v4 programming model
// Import all function handlers
export { login } from '../login/index';
export { register } from '../register/index';
export { getProjects } from '../projects-get/index';
export { createProject } from '../projects-create/index';
export { updateProject } from '../projects-update/index';
export { deleteProject } from '../projects-delete/index';
export { startTimer } from '../timer-start/index';
export { stopTimer } from '../timer-stop/index';
export { getCurrentTimer } from '../timer-current/index';
export { getTimeEntries } from '../timeentries-get/index';
export { addManualEntry } from '../timeentries-add-manual/index';
export { updateTimeEntry } from '../timeentries-update/index';
export { deleteTimeEntry } from '../timeentries-delete/index';
export { getWarnings } from '../warnings-get/index';
export { getReports } from '../reports-get/index';
export { exportCSV } from '../reports-export-csv/index';
export { exportJSON } from '../reports-export-json/index';
export { init, initHttp } from '../init/index';
