// @ts-nocheck

/**
 * Build Binder application engine.
 *
 * Kept deliberately close to the proven v0.3 standalone implementation so
 * existing browser data and behaviour remain compatible during the initial
 * React/Vite migration. React owns the persistent app shell; this module owns
 * the binder's local-first data model and interactive workspace.
 */
export function initBuildBinder(): void {
  'use strict';

  const STORAGE_KEY = 'theBuildBinder.v1';
  const APP_VERSION = '0.3.0';

  const galleryDefinitions = {
    identity: ['Identity / compliance plate','VIN or chassis stamping','Engine identifier','Transmission / axle identifier','Surviving paint evidence','Trim / interior evidence'],
    baseline: ['Front three-quarter','Rear three-quarter','Left side','Right side','Engine bay','Cabin / dashboard','Underbody / structure','Boot / load area'],
    body: ['Original or surviving finish','Approved spray-out','Repair evidence','Finished result'],
    interior: ['Interior before','Dashboard / controls','Trim reference','Interior finished'],
    milestones: ['Before — repeatable angle','After — same angle','Detail before','Detail after'],
    electrical: ['Wiring / harness','Connectors / terminals','Component identification','Installed electrical parts'],
    disassembly: ['Before removal','As found','Damage / faults','Parts and fixings']
  };

  const legacyPhotoGallery = {
    'identity-plate':'identity', vin:'identity', 'engine-id':'identity', 'transmission-id':'identity', 'paint-evidence':'identity', 'trim-evidence':'identity',
    'front-34':'baseline', 'rear-34':'baseline', 'left-side':'baseline', 'right-side':'baseline', 'engine-bay':'baseline', cabin:'baseline', underbody:'baseline', boot:'baseline',
    'paint-before':'body', 'spray-out':'body', 'body-repair':'body', 'paint-final':'body',
    'interior-before':'interior', dashboard:'interior', 'trim-reference':'interior', 'interior-final':'interior',
    'milestone-before':'milestones', 'milestone-after':'milestones', 'detail-before':'milestones', 'detail-after':'milestones'
  };

  const sectionDefs = [
    { id: 'dashboard', index: '00', label: 'Command Centre', group: 'OVERVIEW' },
    { id: 'identity', index: '01', label: 'Identity & History', group: 'PROJECT RECORD' },
    { id: 'baseline', index: '02', label: 'Baseline Condition', group: 'PROJECT RECORD' },
    { id: 'vision', index: '03', label: 'Vision & Scope', group: 'PROJECT RECORD' },
    { id: 'planning', index: '04', label: 'Planning & Decisions', group: 'CONTROL' },
    { id: 'disassembly', index: '05', label: 'Disassembly & Parts', group: 'CONTROL' },
    { id: 'body', index: '06', label: 'Body, Shell & Paint', group: 'BUILD SYSTEMS' },
    { id: 'chassis', index: '07', label: 'Chassis, Brakes & Wheels', group: 'BUILD SYSTEMS' },
    { id: 'powertrain', index: '08', label: 'Engine and Driveline', group: 'BUILD SYSTEMS' },
    { id: 'electrical', index: '09', label: 'Electrical & Parts', group: 'BUILD SYSTEMS' },
    { id: 'interior', index: '10', label: 'Interior, Trim & Glass', group: 'BUILD SYSTEMS' },
    { id: 'commercial', index: '11', label: 'Parts & Budget', group: 'DELIVERY' },
    { id: 'worklog', index: '12', label: 'Work, Issues & Milestones', group: 'DELIVERY' },
    { id: 'handover', index: '13', label: 'Compliance & Handover', group: 'DELIVERY' },
    { id: 'library', index: '14', label: 'Reference Library', group: 'DELIVERY' },
    { id: 'design', index: 'DL', label: 'Binder design lab', group: 'REFINE THE BINDER' }
  ];

  const tableSchemas = {
    evidence: {
      columns: [
        ['id','Evidence ID','text'], ['item','Evidence / claim','text'], ['source','Source / link','text'],
        ['supports','What it supports','text'], ['status','Confidence','status']
      ],
      blank: { id:'EV-', item:'', source:'', supports:'', status:'TO VERIFY' }
    },
    history: {
      columns: [['date','Date / era','text'],['event','Event or claim','text'],['source','Source','text'],['status','Confidence','status']],
      blank: { date:'', event:'', source:'', status:'TO VERIFY' }
    },
    condition: {
      columns: [['area','Area','text'],['condition','Observed condition','text'],['priority','Priority','priority'],['photoEvidence','Evidence photo','conditionphotos']],
      blank: { area:'', condition:'', priority:'MEDIUM', evidence:'', photoEvidence:'' }
    },
    decisions: {
      columns: [['id','Decision ID','text'],['decision','Decision / options','text'],['chosen','Direction & reason','text'],['date','Date','date'],['status','Status','status']],
      blank: { id:'DEC-', decision:'', chosen:'', date:'', status:'DRAFT' }
    },
    risks: {
      columns: [['id','Risk ID','text'],['risk','Risk / consequence','text'],['likelihood','Likelihood','risk'],['impact','Impact','risk'],['control','Control / next action','text'],['owner','Owner','text']],
      blank: { id:'R-', risk:'', likelihood:'MEDIUM', impact:'MEDIUM', control:'', owner:'' }
    },
    actions: {
      columns: [['priority','Priority','priority'],['action','Action','text'],['owner','Owner','text'],['due','Due','date'],['status','Status','taskstatus']],
      blank: { priority:'MEDIUM', action:'', owner:'', due:'', status:'NOT STARTED' }
    },
    inventory: {
      columns: [['tag','Tag','text'],['part','Part / assembly','text'],['condition','Condition','text'],['disposition','Disposition','disposition'],['location','Location','text'],['status','Status','taskstatus']],
      blank: { tag:'', part:'', condition:'', disposition:'RETAIN', location:'', status:'NOT STARTED' }
    },
    disassemblyLog: {
      columns: [['location','Location','text'],['part','Part','text'],['date','Date','date'],['description','Description','textarea'],['faults','Issues / faults found','textarea'],['photoId','Photo link','disassemblyphoto']],
      blank: { location:'', part:'', date:'', description:'', faults:'', photoId:'' }
    },
    body: {
      columns: [['area','Area','text'],['condition','Condition / evidence','text'],['strategy','Repair strategy','text'],['specialist','Specialist','text'],['status','Status','taskstatus']],
      blank: { area:'', condition:'', strategy:'', specialist:'', status:'NOT STARTED' }
    },
    rustRepairs: {
      columns: [['area','Area','text'],['condition','Condition','text'],['requiredRepair','Required repair','text'],['patchPanelUsed','Patch panel used','text'],['status','Repair complete','taskstatus']],
      blank: { area:'', condition:'', requiredRepair:'', patchPanelUsed:'', status:'NOT STARTED' }
    },
    systems: {
      columns: [['system','System','text'],['existing','Existing / evidence','text'],['planned','Planned work / target','text'],['parts','Parts / supplier','text'],['verification','Verification','text'],['status','Status','taskstatus']],
      blank: { system:'', existing:'', planned:'', parts:'', verification:'', status:'NOT STARTED' }
    },
    circuits: {
      columns: [['circuit','Circuit / load','text'],['supply','Supply / fuse','text'],['route','Route / connector','text'],['earth','Earth','text'],['test','Test result','text'],['status','Status','taskstatus']],
      blank: { circuit:'', supply:'', route:'', earth:'', test:'', status:'NOT STARTED' }
    },
    electricalParts: {
      columns: [['part','Part / component','text'],['specification','Specification / rating','text'],['quantity','Qty','number'],['supplierLink','Supplier / link','text'],['photoId','Photos','electricalpartphoto']],
      blank: { part:'', specification:'', quantity:'', supplierLink:'', photoId:'' }
    },
    chassisParts: {
      columns: [['part','Part / component','text'],['specification','Specification','text'],['quantity','Qty','number'],['supplierLink','Supplier / link','text'],['status','Status','taskstatus']],
      blank: { part:'', specification:'', quantity:'', supplierLink:'', status:'NOT STARTED' }
    },
    trim: {
      columns: [['area','Area','text'],['existing','Existing / evidence','text'],['target','Target / material','text'],['supplier','Supplier / craftsperson','text'],['status','Status','taskstatus']],
      blank: { area:'', existing:'', target:'', supplier:'', status:'NOT STARTED' }
    },
    parts: {
      columns: [['id','PO / ID','text'],['item','Parts','text'],['supplier','Supplier','text'],['ordered','Ordered','date'],['cost','Cost','number'],['status','Status','partsstatus']],
      blank: { id:'P-', item:'', supplier:'', ordered:'', cost:'', status:'NOT STARTED' }
    },
    specialistRepairs: {
      columns: [['id','PO / ID','text'],['item','Service','text'],['supplier','Supplier','text'],['ordered','Ordered','date'],['cost','Cost','number'],['status','Status','partsstatus']],
      blank: { id:'SR-', item:'', supplier:'', ordered:'', cost:'', status:'NOT STARTED' }
    },
    consumables: {
      columns: [['id','PO / ID','text'],['item','Item','text'],['supplier','Supplier','text'],['ordered','Ordered','date'],['cost','Cost','number'],['status','Status','partsstatus']],
      blank: { id:'C-', item:'', supplier:'', ordered:'', cost:'', status:'NOT STARTED' }
    },
    budget: {
      columns: [['category','Category','text'],['budget','Budget','number'],['committed','Committed','number'],['paid','Paid','number'],['forecast','Forecast','number']],
      blank: { category:'', budget:'', committed:'', paid:'', forecast:'' }
    },
    worklog: {
      columns: [['date','Date','date'],['hours','Hours','number'],['hourlyRate','Cost per hour','number'],['area','Area','text'],['work','Work completed','text'],['evidence','Parts / evidence','text'],['by','By','text']],
      blank: { date:'', hours:'', hourlyRate:'', area:'', work:'', evidence:'', by:'' }
    },
    issues: {
      columns: [['id','Issue ID','text'],['issue','Issue / change','text'],['impact','Impact','text'],['action','Action / decision','text'],['owner','Owner','text'],['status','Status','taskstatus']],
      blank: { id:'ISS-', issue:'', impact:'', action:'', owner:'', status:'OPEN' }
    },
    compliance: {
      columns: [['requirement','Requirement','text'],['authority','Authority / specialist','text'],['evidence','Evidence / certificate','text'],['date','Date','date'],['status','Status','taskstatus']],
      blank: { requirement:'', authority:'', evidence:'', date:'', status:'NOT STARTED' }
    },
    tests: {
      columns: [['stage','Stage','text'],['checks','Checks / limits','text'],['result','Result','text'],['issues','Issues raised','text'],['approved','Approved by','text'],['status','Status','taskstatus']],
      blank: { stage:'', checks:'', result:'', issues:'', approved:'', status:'NOT STARTED' }
    },
    references: {
      columns: [['id','Ref ID','text'],['document','Document / source','text'],['version','Version / date','text'],['location','Location / link','text'],['used','Used for','text']],
      blank: { id:'REF-', document:'', version:'', location:'', used:'' }
    },
    refinements: {
      columns: [['priority','Priority','priority'],['change','Requested change','text'],['reason','Reason / outcome','text'],['status','Decision','taskstatus']],
      blank: { priority:'MEDIUM', change:'', reason:'', status:'OPEN' }
    }
  };
  tableSchemas.chassis = tableSchemas.systems;
  tableSchemas.powertrain = tableSchemas.systems;
  const costFields = new Set(['budget','committed','paid','forecast','cost','hourlyRate']);

  const phaseNames = ['Discover / plan','Strip / catalog','Body / structure','Systems rebuild','Finish & assembly','Test & complete'];
  const systemPhases = [
    ['driveline','Driveline'],
    ['interior','Interior'],
    ['paint','Paint'],
    ['electrical','Electrical']
  ];

  const baselineChecks = [
    'Stabilise the vehicle and confirm safe lifting points.', 'Isolate battery and electrical hazards.',
    'Assess fuel, oil, coolant and brake-fluid leakage.', 'Protect openings from moisture and pests.',
    'Photograph fragile, rare or loose items.', 'Tag parts at risk of being separated.'
  ];
  const disassemblyChecks = [
    'Photograph item before removal.', 'Photograph orientation and routing.', 'Bag and label fasteners with their assembly.',
    'Record condition and repair decision.', 'Protect delicate finishes and glass.', 'Update inventory before moving to the next assembly.'
  ];
  const acceptanceChecks = [
    'Part number and application verified.', 'Condition checked on arrival.', 'Dimensions and orientation compared before modification.',
    'Receipt, warranty and serial number saved.', 'Return deadline recorded.', 'Inventory and budget updated.'
  ];
  const preStartChecks = [
    'Fluids filled, primed and independently checked.', 'Fuel, coolant, oil and brake systems leak-tested.',
    'Electrical protection and earths verified.', 'Throttle, clutch, selector and steering travel clear.',
    'Fire extinguisher and shutdown plan ready.', 'Observers have roles and safe positions.'
  ];
  const handoverChecks = [
    'Final target specification marked VERIFIED.', 'Current wiring diagram and fuse list.', 'Fluid, filter and service specification.',
    'Alignment and setup sheet.', 'Parts, paint and trim references.', 'Receipts, warranties and certificates.',
    'Known limitations or accepted defects.', 'Photo story and valuation or insurance record.'
  ];

  function uid(prefix='id') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
  function today() { return new Date().toISOString().slice(0,10); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function esc(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function slug(value='') { return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  function money(value) { return new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(value)||0); }

  function row(data) { return { _id: uid('row'), ...data }; }

  function starterProject() {
    return {
      id: 'wild-plum-xa',
      meta: {
        name: 'Wild Plum XA', vehicle: 'XA Coupe · details to verify', code: 'WPXA-001', version: 'v0.1',
        phase: 0, status: 'DRAFT', owner: '', updated: '2026-10-23', showcase: true
      },
      fields: {
        manufacturer: '', model: 'XA', series: '', bodyStyle: 'Coupe', buildDate: '', vin: '', registration: '',
        engineNumber: '', transmissionId: '', paintCode: '', trimCode: '', odometer: '', identityStatus: 'TO VERIFY',
        historySummary: 'Showcase project only. Factory colour, codes, options and mechanical specifications remain to verify.',
        intendedUse: 'Road use with a period-respectful character', approach: 'SYMPATHETIC', finishStandard: 'DRIVER / SHOW',
        authenticity: 'High where verified', performanceGoal: '', reliabilityGoal: 'Road-usable, serviceable and documented',
        comfortGoal: '', nonNegotiables: 'Preserve provenance and original evidence before irreversible work.',
        visionStatement: '',
        success: 'Create a documented, period-respectful and road-usable XA Coupe with Wild Plum as its signature identity. Preserve evidence before disassembly and verify specification claims.',
        inScope: 'Baseline, identity research, shell assessment and restoration planning.', deferred: '', outScope: '',
        tagPrefix: 'WPXA', areaCodes: 'BDY / ENG / DRV / CHS / ELE / INT', containerFormat: 'Zone / shelf / tub / bag',
        colourDirection: 'Wild Plum — final code and originality TO VERIFY', paintSystem: '', glossTarget: '', protection: '',
        engineId: '', transmissionBuildId: '', axleId: '', builder: '', targetOutput: '', buildSheet: '',
        voltage: '12 V — verify current configuration', battery: '', mainProtection: '', earthStrategy: '', harness: '', diagram: '',
        binderLocation: '', mediaLocation: '', nextMilestone: 'Baseline captured and identity evidence logged', nextReview: '',
        designUseful: '', designMissing: '', designRemove: '', designDetail: '', designNotes: ''
      },
      checklists: {
        baseline: baselineChecks.map((label,i)=>({label,done:i===3})),
        disassembly: disassemblyChecks.map(label=>({label,done:false})),
        acceptance: acceptanceChecks.map(label=>({label,done:false})),
        prestart: preStartChecks.map(label=>({label,done:false})),
        handover: handoverChecks.map(label=>({label,done:false}))
      },
      tables: {
        evidence: [row({id:'EV-001',item:'Project name and vehicle description supplied by owner',source:'Project brief',supports:'Showcase identity',status:'VERIFIED'}), row({id:'EV-002',item:'Factory paint colour / code',source:'Vehicle evidence required',supports:'Original specification',status:'TO VERIFY'})],
        history: [row({date:'',event:'Acquisition / ownership history',source:'To be recorded',status:'TO VERIFY'})],
        condition: ['Body / shell','Chassis / structure','Engine / fuel / cooling','Driveline','Brakes / steering / suspension','Electrical','Interior / glass / seals'].map(area=>row({area,condition:'',priority:'MEDIUM',evidence:''})),
        decisions: [row({id:'DEC-001',decision:'Restoration approach',chosen:'Develop after baseline and owner goals',date:'',status:'DRAFT'})],
        risks: [row({id:'R-001',risk:'Hidden corrosion expands body scope',likelihood:'MEDIUM',impact:'HIGH',control:'Complete structured inspection before finish commitment',owner:''})],
        actions: [
          row({priority:'HIGH',action:'Photograph whole vehicle, identifiers, gaps, damage and loose parts',owner:'',due:'',status:'NOT STARTED'}),
          row({priority:'HIGH',action:'Capture exact identifier text and locations',owner:'',due:'',status:'NOT STARTED'}),
          row({priority:'HIGH',action:'Assess shell, corrosion and immediate preservation needs',owner:'',due:'',status:'NOT STARTED'}),
          row({priority:'MEDIUM',action:'Set initial scope boundaries and decision gates',owner:'',due:'',status:'NOT STARTED'})
        ],
        inventory: [],
        disassemblyLog: [],
        body: ['Front structure / panels','Cabin / floor / sills','Rear structure / quarters','Doors / hinges / gaps','Boot / bonnet / closures','Underbody / mounts'].map(area=>row({area,condition:'',strategy:'',specialist:'',status:'NOT STARTED'})),
        rustRepairs: [],
        chassis: ['Front suspension','Rear suspension','Steering','Brakes','Wheels / tyres','Bearings / hubs'].map(system=>row({system,existing:'',planned:'',parts:'',verification:'',status:'NOT STARTED'})),
        chassisParts: [],
        powertrain: ['Engine','Transmission','Differential / axle','Fuel','Cooling','Induction','Exhaust','Lubrication'].map(system=>row({system,existing:'',planned:'',parts:'',verification:'',status:'NOT STARTED'})),
        circuits: ['Starting / charging','Ignition / engine','Lighting','Instruments','Accessories','Added circuits'].map(circuit=>row({circuit,supply:'',route:'',earth:'',test:'',status:'NOT STARTED'})),
        electricalParts: [],
        trim: ['Seats / upholstery','Carpet / insulation','Dashboard / instruments','Door / quarter trims','Headlining / roof trim','Brightwork / hardware','Glass / seals'].map(area=>row({area,existing:'',target:'',supplier:'',status:'NOT STARTED'})),
        parts: [], specialistRepairs: [], consumables: [],
        budget: ['Vehicle / acquisition','Body / paint','Powertrain','Chassis / brakes / wheels','Electrical','Interior / glass / trim','Compliance / testing','Contingency'].map(category=>row({category,budget:'',committed:'',paid:'',forecast:''})),
        worklog: [], issues: [],
        compliance: ['Ownership / registration','Identity / modification approval','Roadworthiness / inspection','Insurance / valuation'].map(requirement=>row({requirement,authority:'',evidence:'',date:'',status:'NOT STARTED'})),
        tests: ['Static / no start','First start','Workshop movement','Low-speed road','Extended road','Final acceptance'].map(stage=>row({stage,checks:'',result:'',issues:'',approved:'',status:'NOT STARTED'})),
        references: [], refinements: []
      },
      photos: {},
      photoGalleries: { identity:[], baseline:[], body:[], interior:[], milestones:[], electrical:[], disassembly:[] },
      projectImage: null,
      preferences: { density:'standard', contrast:'standard', accent:'blueprint', printScope:'current', costTracking:true }
    };
  }

  function genericProject(name='Untitled restoration', vehicle='Vehicle details to enter') {
    const project = starterProject();
    project.id = uid('project');
    project.meta = { name, vehicle, code:'NEW-001', version:'v0.1', phase:0, status:'DRAFT', owner:'', updated:today(), showcase:false };
    project.fields = Object.fromEntries(Object.keys(project.fields).map(k=>[k,'']));
    project.fields.identityStatus = 'DRAFT';
    project.fields.approach = 'UNDECIDED';
    project.fields.nextMilestone = 'Complete project snapshot and baseline record';
    project.tables = Object.fromEntries(Object.keys(project.tables).map(k=>[k,[]]));
    project.tables.condition = ['Body / shell','Chassis / structure','Engine / fuel / cooling','Driveline','Brakes / steering / suspension','Electrical','Interior / glass / seals'].map(area=>row({area,condition:'',priority:'MEDIUM',evidence:''}));
    project.tables.budget = ['Vehicle / acquisition','Body / paint','Powertrain','Chassis / brakes / wheels','Electrical','Interior / glass / trim','Compliance / testing','Contingency'].map(category=>row({category,budget:'',committed:'',paid:'',forecast:''}));
    project.checklists = {
      baseline: baselineChecks.map(label=>({label,done:false})), disassembly: disassemblyChecks.map(label=>({label,done:false})),
      acceptance: acceptanceChecks.map(label=>({label,done:false})), prestart: preStartChecks.map(label=>({label,done:false})), handover: handoverChecks.map(label=>({label,done:false}))
    };
    project.projectImage = null;
    project.photoGalleries = { identity:[], baseline:[], body:[], interior:[], milestones:[], electrical:[], disassembly:[] };
    return project;
  }

  function prepopulatedGenericProject(name,vehicle) {
    const project=genericProject(name,vehicle);
    project.tables.actions=[
      'Complete vehicle identity and history research',
      'Photograph and record baseline condition',
      'Confirm restoration goals and scope',
      'Inspect body, structure and corrosion',
      'Create parts inventory and storage records',
      'Plan and record system rebuild work',
      'Document testing, compliance and handover'
    ].map(action=>row({priority:'MEDIUM',action,owner:'',due:'',status:'NOT STARTED'}));
    project.tables.body=['Front structure / panels','Cabin / floor / sills','Rear structure / quarters','Doors / hinges / gaps','Boot / bonnet / closures','Underbody / mounts']
      .map(area=>row({area,condition:'',strategy:'',specialist:'',status:'NOT STARTED'}));
    project.tables.chassis=['Front suspension','Rear suspension','Steering','Brakes','Wheels / tyres','Bearings / hubs']
      .map(system=>row({system,existing:'',planned:'',parts:'',verification:'',status:'NOT STARTED'}));
    project.tables.powertrain=['Engine','Transmission','Differential / axle','Fuel','Cooling','Induction','Exhaust','Lubrication']
      .map(system=>row({system,existing:'',planned:'',parts:'',verification:'',status:'NOT STARTED'}));
    project.tables.circuits=['Starting / charging','Ignition / engine','Lighting','Instruments','Accessories','Added circuits']
      .map(circuit=>row({circuit,supply:'',route:'',earth:'',test:'',status:'NOT STARTED'}));
    project.tables.trim=['Seats / upholstery','Carpet / insulation','Dashboard / instruments','Door / quarter trims','Headlining / roof trim','Brightwork / hardware','Glass / seals']
      .map(area=>row({area,existing:'',target:'',supplier:'',status:'NOT STARTED'}));
    project.tables.compliance=['Ownership / registration','Identity / modification approval','Roadworthiness / inspection','Insurance / valuation']
      .map(requirement=>row({requirement,authority:'',evidence:'',date:'',status:'NOT STARTED'}));
    project.tables.tests=['Static / no start','First start','Workshop movement','Low-speed road','Extended road','Final acceptance']
      .map(stage=>row({stage,checks:'',result:'',issues:'',approved:'',status:'NOT STARTED'}));
    return project;
  }

  function ensureProjectShape(project) {
    project.tables=project.tables||{};
    if(!Array.isArray(project.tables.parts)) project.tables.parts=[];
    if(!Array.isArray(project.tables.rustRepairs)) project.tables.rustRepairs=[];
    if(!Array.isArray(project.tables.consumables)) project.tables.consumables=[];
    if(!Array.isArray(project.tables.specialistRepairs)) project.tables.specialistRepairs=[];
    if(!Array.isArray(project.tables.electricalParts)) project.tables.electricalParts=[];
    if(!Array.isArray(project.tables.chassisParts)) project.tables.chassisParts=[];
    if(!Array.isArray(project.tables.disassemblyLog)) project.tables.disassemblyLog=[];
    project.photos=project.photos||{};
    project.photoGalleries=project.photoGalleries||{};
    Object.keys(galleryDefinitions).forEach(key=>{ if(!Array.isArray(project.photoGalleries[key])) project.photoGalleries[key]=[]; });
    // Preserve photographs created in v0.1/v0.2 by moving fixed-slot images into the new open galleries.
    Object.entries(project.photos).forEach(([legacyKey,dataUrl])=>{
      const gallery=legacyPhotoGallery[legacyKey];
      if(!gallery || !dataUrl || project.photoGalleries[gallery].some(photo=>photo.legacyKey===legacyKey)) return;
      const label=galleryDefinitions[gallery]?.find((_,i)=>Object.keys(legacyPhotoGallery).filter(key=>legacyPhotoGallery[key]===gallery)[i]===legacyKey) || legacyKey;
      project.photoGalleries[gallery].push({ id:uid('photo'), dataUrl, name:legacyKey, caption:label, legacyKey, added:new Date().toISOString() });
    });
    project.preferences=project.preferences||{density:'standard',contrast:'standard',accent:'blueprint',printScope:'current'};
    if(typeof project.preferences.costTracking!=='boolean') project.preferences.costTracking=true;
    return project;
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved?.projects?.length) { saved.projects.forEach(ensureProjectShape); return saved; }
    } catch (error) { console.warn('Could not load saved binder',error); }
    const project = starterProject();
    return { version:APP_VERSION, activeProjectId:project.id, projects:[project] };
  }

  let state = loadState();
  let activeSection = location.hash.replace('#','') || 'dashboard';
  if (!sectionDefs.some(s=>s.id===activeSection)) activeSection='dashboard';
  let saveTimer;
  let pendingProjectImage=null;
  let dashboardActionTab='open';
  let actionRegisterTab='open';
  const editableChecklists = new Set();

  const $ = selector => document.querySelector(selector);
  const app = $('#app');
  const projectSelect = $('#projectSelect');
  const nav = $('#mainNav');

  function activeProject() { return state.projects.find(p=>p.id===state.activeProjectId) || state.projects[0]; }
  function costTrackingEnabled(p=activeProject()) { return p.preferences?.costTracking!==false; }
  function persistStateNow(message='',successToast=false) {
    try {
      activeProject().meta.updated=today();
      state.version=APP_VERSION;
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      $('#saveState').classList.remove('saving');
      $('#saveState').innerHTML='<i></i> Saved locally';
      if(successToast && message) toast('Saved',message);
      updateProjectChrome();
      return true;
    } catch(error) {
      $('#saveState').classList.remove('saving');
      $('#saveState').innerHTML='<i></i> Not saved';
      toast('Browser storage is full','This change could not be saved locally. Export a backup, remove some photos, or use smaller images.');
      console.warn('Build Binder local save failed',error);
      return false;
    }
  }

  function queueSave(message='Changes saved') {
    $('#saveState').classList.add('saving');
    $('#saveState').innerHTML='<i></i> Saving…';
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{
      persistStateNow(message,Boolean(message));
    },400);
  }

  function toast(title,message) {
    const el=document.createElement('div'); el.className='toast';
    el.innerHTML=`<strong>${esc(title)}</strong><span>${esc(message)}</span>`;
    $('#toastRegion').append(el);
    setTimeout(()=>el.remove(),2600);
  }

  function updateProjectChrome() {
    const p=activeProject();
    projectSelect.innerHTML=state.projects.map(x=>`<option value="${esc(x.id)}" ${x.id===p.id?'selected':''}>${esc(x.meta.name)}${x.meta.showcase?' · SHOWCASE':''}</option>`).join('');
    $('#plaqueName').textContent=p.meta.name;
    $('#plaqueVehicle').textContent=p.meta.vehicle || 'Vehicle details to enter';
    $('#plaqueCode').textContent=p.meta.code || 'NO CODE';
    $('#plaqueVersion').textContent=p.meta.version || 'v0.1';
    const projectImage=p.projectImage?.dataUrl;
    const preview=$('#projectImagePreview');
    preview.hidden=!projectImage;
    preview.src=projectImage || '';
    preview.alt=projectImage ? `${p.meta.name} project image or logo` : '';
    $('#projectImagePlaceholder').hidden=Boolean(projectImage);
    $('#projectImageActionLabel').textContent=projectImage ? '↻ Change image' : '＋ Add image';
    $('#projectImageRemove').hidden=!projectImage;
    document.body.classList.toggle('compact',p.preferences?.density==='compact');
    document.body.classList.toggle('high-contrast',p.preferences?.contrast==='high');
  }

  function sectionCount(id,p=activeProject()) {
    const map={
      identity:(p.tables.evidence?.length||0)+(p.tables.history?.length||0), baseline:p.tables.condition?.length||0,
      planning:(p.tables.actions?.length||0)+(p.tables.decisions?.length||0)+(p.tables.risks?.length||0),
      disassembly:p.tables.inventory?.length||0, body:(p.tables.body?.length||0)+(p.tables.rustRepairs?.length||0),
      chassis:(p.tables.chassis?.length||0)+(p.tables.chassisParts?.length||0), powertrain:p.tables.powertrain?.length||0,
      electrical:p.tables.circuits?.length||0, interior:p.tables.trim?.length||0,
      commercial:(p.tables.parts?.length||0)+(p.tables.specialistRepairs?.length||0)+(p.tables.consumables?.length||0)+(p.tables.budget?.length||0), worklog:(p.tables.worklog?.length||0)+(p.tables.issues?.length||0),
      handover:(p.tables.compliance?.length||0)+(p.tables.tests?.length||0), library:p.tables.references?.length||0,
      design:p.tables.refinements?.length||0
    };
    return map[id] ?? '';
  }

  function renderNav() {
    let group='';
    nav.innerHTML=sectionDefs.map(s=>{
      const heading=s.group!==group ? `<div class="nav-group-label">${group=s.group}</div>` : '';
      return `${heading}<button class="nav-item ${s.id===activeSection?'active':''}" data-section="${s.id}"><span class="nav-index">${s.index}</span><strong>${s.label}</strong><span class="nav-count">${sectionCount(s.id)}</span></button>`;
    }).join('');
  }

  function header(section,title,description,actions=true) {
    return `<div class="page-header">
      <div class="page-title-block"><span class="sheet-index">${section}</span><div><span class="eyebrow">BUILD BINDER · SHEET ${section}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div></div>
      ${actions?`<div class="page-actions"><button class="button ghost small" data-action="quick-add">＋ Quick add</button><button class="button ghost small" data-action="print">Print view</button></div>`:''}
    </div>`;
  }

  function card(title,body,{span='',meta='',className=''}={}) {
    return `<section class="card ${span} ${className}"><header class="card-header"><h2>${title}</h2>${meta?`<small>${meta}</small>`:''}</header><div class="card-body">${body}</div></section>`;
  }

  const fieldTypes = {
    status:['DRAFT','TO VERIFY','VERIFIED','SUPERSEDED'],
    projectStatus:['DRAFT','ACTIVE','PAUSED','COMPLETE'],
    approach:['UNDECIDED','PRESERVATION','FACTORY-CORRECT','SYMPATHETIC','RESTOMOD','CUSTOM'],
    finish:['DRIVER','DRIVER / SHOW','SHOW','CONCOURS','COMPETITION','OTHER']
  };

  function field(label,key,{type='text',placeholder='Click or tap to enter…',span='',options=null,path='fields'}={}) {
    const p=activeProject();
    const source=path==='meta'?p.meta:p.fields;
    const value=source[key] ?? '';
    let control;
    const opts=options || fieldTypes[type];
    if (opts) {
      control=`<select data-field="${key}" data-path="${path}">${opts.map(o=>`<option value="${esc(o)}" ${value===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
    } else if(type==='textarea') {
      control=`<textarea class="auto-grow" data-field="${key}" data-path="${path}" placeholder="${esc(placeholder)}" rows="3">${esc(value)}</textarea>`;
    } else if(type==='text') {
      control=`<textarea class="auto-grow auto-grow-compact" data-field="${key}" data-path="${path}" placeholder="${esc(placeholder)}" rows="1">${esc(value)}</textarea>`;
    } else {
      control=`<input data-field="${key}" data-path="${path}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}">`;
    }
    return `<div class="field ${span}"><label>${esc(label)}</label>${control}</div>`;
  }

  function badge(status='DRAFT') { return `<span class="badge ${slug(status)}">${esc(status)}</span>`; }

  function selectOptions(type,value) {
    const choices={
      status:['DRAFT','TO VERIFY','VERIFIED','SUPERSEDED'], priority:['LOW','MEDIUM','HIGH','CRITICAL'], risk:['LOW','MEDIUM','HIGH'],
      taskstatus:['NOT STARTED','IN PROGRESS','BLOCKED','OPEN','COMPLETE','CLOSED'],
      partsstatus:['NOT STARTED','NEEDED','ORDERED','IN STOCK','COMPLETE'], disposition:['RETAIN','REPAIR','REPLACE','MISSING','SURPLUS']
    }[type] || [];
    return choices.map(o=>`<option value="${o}" ${value===o?'selected':''}>${o}</option>`).join('');
  }

  function table(name,title,emptyText='No records yet') {
    const p=activeProject(); const schema=tableSchemas[name];
    const allRows=p.tables[name]||[];
    const rows=name==='actions'
      ?allRows.filter(item=>actionRegisterTab==='complete'?item.status==='COMPLETE':item.status!=='COMPLETE')
      :allRows;
    const columns=schema.columns.filter(([key])=>costTrackingEnabled(p)||!costFields.has(key));
    const headers=columns.map(c=>`<th>${esc(c[1])}</th>`).join('')+'<th aria-label="Row actions"></th>';
    const body=rows.map(r=>`<tr data-row="${r._id}">${columns.map(([key,label,type])=>{
      const value=r[key]??'';
      if(type==='conditionphotos'){
        const linkedPhotos=(p.photoGalleries?.baseline||[]).filter(photo=>photo.conditionIds?.includes(r._id));
        const legacyEvidence=r.evidence?`<small class="legacy-evidence">${esc(r.evidence)}</small>`:'';
        return `<td class="condition-photo-cell"><select data-condition-photo-select aria-label="Evidence photos for ${esc(r.area||'condition summary')}" ${linkedPhotos.length?'':'disabled'}><option value="">${linkedPhotos.length?'Select a photo…':'No linked photos'}</option>${linkedPhotos.map(photo=>`<option value="${esc(photo.id)}">${esc(photo.caption||photo.name||'Untitled photo')}</option>`).join('')}</select>${legacyEvidence}</td>`;
      }
      if(type==='electricalpartphoto'){
        const photos=p.photoGalleries?.electrical||[];
        const linkedPhoto=photos.find(photo=>photo.id===value);
        const photoButton=linkedPhoto
          ?`<button class="electrical-part-photo" type="button" data-photo-preview="electrical" data-photo-id="${esc(linkedPhoto.id)}" aria-label="Open photo ${esc(linkedPhoto.caption||linkedPhoto.name||'electrical part')}"><img src="${linkedPhoto.dataUrl}" alt=""><span data-electrical-photo-label data-photo-id="${esc(linkedPhoto.id)}">${esc(linkedPhoto.caption||linkedPhoto.name||'View photo')}</span></button>`
          :'<span class="electrical-part-photo-empty">No photo linked</span>';
        return `<td><div class="electrical-part-photo-cell">${photoButton}<button class="electrical-part-photo-picker" type="button" data-electrical-photo-picker="${esc(r._id)}" aria-label="Add or link a photo for ${esc(r.part||'electrical part')}" title="Add or link a photo">▾</button></div></td>`;
      }
      if(type==='disassemblyphoto'){
        const photos=p.photoGalleries?.disassembly||[];
        return `<td><select data-disassembly-photo-link aria-label="Photo for ${esc(r.part||r.location||'disassembly record')}" ${photos.length?'':'disabled'}><option value="">${photos.length?'No photo linked':'Add a disassembly photo below'}</option>${photos.map(photo=>`<option value="${esc(photo.id)}" ${value===photo.id?'selected':''}>${esc(photo.caption||photo.name||'Untitled photo')}</option>`).join('')}</select></td>`;
      }
      if (['status','priority','risk','taskstatus','partsstatus','disposition'].includes(type)) return `<td><select aria-label="${esc(label)}" data-table="${name}" data-key="${key}">${selectOptions(type,value)}</select></td>`;
      if (type==='text') return `<td><textarea class="auto-grow auto-grow-compact" aria-label="${esc(label)}" data-table="${name}" data-key="${key}" rows="1" placeholder="Enter…">${esc(value)}</textarea></td>`;
      if (type==='textarea') return `<td><textarea class="auto-grow" aria-label="${esc(label)}" data-table="${name}" data-key="${key}" rows="2" placeholder="Enter…">${esc(value)}</textarea></td>`;
      return `<td><input aria-label="${esc(label)}" data-table="${name}" data-key="${key}" type="${type}" value="${esc(value)}" placeholder="Enter…" ${type==='number'?'step="0.01"':''}></td>`;
    }).join('')}<td><button class="row-delete" data-delete-row="${name}" aria-label="Delete row" title="Delete row">×</button></td></tr>`).join('');
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length+1}"><div class="empty-state"><h3>${esc(emptyText)}</h3><p>Add the first record when it is needed.</p></div></td></tr>`}</tbody></table></div><div class="table-actions"><button class="button ghost small" data-add-row="${name}">＋ Add row</button></div>`;
  }

  function checklist(name) {
    const list=activeProject().checklists[name]||[];
    const editing=editableChecklists.has(name);
    return `<div class="checklist-toolbar"><button class="button ghost small" data-checklist-edit="${name}">${editing?'Done':'Edit list'}</button></div><div class="check-list">${list.map((item,i)=>`<div class="check-item"><input id="${name}-${i}" type="checkbox" data-checklist="${name}" data-index="${i}" ${item.done?'checked':''}>${editing?`<input class="checklist-label-input" type="text" data-checklist-label="${name}" data-index="${i}" value="${esc(item.label)}" aria-label="Checklist item ${i+1}">`:`<label for="${name}-${i}">${esc(item.label)}</label>`}${editing?`<button class="row-delete" data-checklist-remove="${name}" data-index="${i}" aria-label="Remove checklist item" title="Remove item">×</button>`:`<small>${item.done?'DONE':'OPEN'}</small>`}</div>`).join('')}</div>${editing?`<div class="checklist-add"><input type="text" data-checklist-new="${name}" placeholder="New checklist item…" aria-label="New checklist item"><button class="button ghost small" data-checklist-add="${name}">＋ Add item</button></div>`:''}`;
  }

  function photoGallery(galleryKey) {
    const p=activeProject();
    const photos=p.photoGalleries?.[galleryKey]||[];
    const suggestions=galleryDefinitions[galleryKey]||[];
    const cards=photos.map((photo,index)=>`<figure class="gallery-photo" id="photo-${esc(photo.id)}" data-gallery-photo="${esc(photo.id)}">
      <div class="gallery-photo-image"><img src="${photo.dataUrl}" alt="${esc(photo.caption||photo.name||`Project photo ${index+1}`)}" data-photo-preview="${esc(galleryKey)}" data-photo-id="${esc(photo.id)}"></div>
      <figcaption><input type="text" data-gallery-caption="${galleryKey}" data-photo-id="${photo.id}" value="${esc(photo.caption||'')}" placeholder="Add a caption…" aria-label="Photo caption"></figcaption>
      ${galleryKey==='baseline'?`<label class="photo-condition-link">Link to condition summary<select data-photo-conditions data-photo-id="${esc(photo.id)}" aria-label="Link photo to a condition summary"><option value="">Not linked</option>${(p.tables.condition||[]).map(condition=>`<option value="${esc(condition._id)}" ${photo.conditionIds?.includes(condition._id)?'selected':''}>${esc([condition.area,condition.condition].filter(Boolean).join(' — ')||'Unspecified condition')}</option>`).join('')}</select></label>`:''}
      <div class="gallery-photo-actions">
        <label for="replace-${photo.id}">Replace</label><input hidden id="replace-${photo.id}" type="file" accept="image/*" data-gallery-replace="${galleryKey}" data-photo-id="${photo.id}">
        <button type="button" data-gallery-remove="${galleryKey}" data-photo-id="${photo.id}">Remove</button>
      </div>
    </figure>`).join('');
    return `<div class="photo-gallery" data-gallery="${galleryKey}">
      <div class="photo-gallery-toolbar">
        <div><strong>${photos.length} ${photos.length===1?'PHOTO':'PHOTOS'}</strong><span>Browser-supported image types; resized and saved as compressed WebP.</span></div>
        <label class="button primary small" for="add-gallery-${galleryKey}">＋ Add photo</label>
        <input hidden id="add-gallery-${galleryKey}" type="file" accept="image/*" multiple data-gallery-add="${galleryKey}">
      </div>
      <div class="photo-gallery-suggestions"><b>Suggested coverage:</b> ${suggestions.map(esc).join(' · ')}</div>
      ${photos.length?`<div class="photo-gallery-grid">${cards}</div>`:`<div class="photo-gallery-empty"><span>＋</span><strong>No photos added yet</strong><p>Use Add Photo to choose image formats supported by your browser. Images are resized and saved as compressed WebP; animated images are saved as a still image. There is no fixed photo count.</p></div>`}
    </div>`;
  }

  function totals(p=activeProject()) {
    if(!costTrackingEnabled(p)) return {budget:0,committed:0,paid:0,forecast:0,labor:0};
    const b=p.tables.budget||[];
    const totals=['budget','committed','paid','forecast'].reduce((acc,key)=>{acc[key]=b.reduce((s,r)=>s+(Number(r[key])||0),0);return acc;},{});
    const completedCosts=['parts','specialistRepairs','consumables']
      .flatMap(key=>p.tables[key]||[])
      .filter(item=>item.status==='COMPLETE')
      .reduce((sum,item)=>sum+(Number(item.cost)||0),0);
    const laborCosts=(p.tables.worklog||[])
      .reduce((sum,item)=>sum+(Number(item.hours)||0)*(Number(item.hourlyRate)||0),0);
    totals.labor=laborCosts;
    totals.paid+=completedCosts+laborCosts;
    totals.forecast+=completedCosts+laborCosts;
    return totals;
  }

  function completion(p=activeProject()) {
    const checks=Object.values(p.checklists||{}).flat();
    const rows=['actions','body','rustRepairs','chassis','powertrain','circuits','trim','compliance','tests'].flatMap(k=>p.tables[k]||[]).filter(r=>r.status);
    const complete=checks.filter(x=>x.done).length + rows.filter(r=>['COMPLETE','CLOSED','VERIFIED'].includes(r.status)).length;
    const total=checks.length+rows.length;
    return total?Math.round(complete/total*100):0;
  }

  function completedSystemPhases(p=activeProject()) {
    const completed=p.meta.systemPhases||{};
    return systemPhases.filter(([id])=>completed[id]===true).length;
  }

  function dashboard() {
    const p=activeProject(); const t=totals(p); const progress=completion(p);
    const openIssues=(p.tables.issues||[]).filter(x=>!['CLOSED','COMPLETE'].includes(x.status)).length;
    const nextActions=(p.tables.actions||[]).filter(x=>x.status!=='COMPLETE').slice(0,5);
    const completedActions=(p.tables.actions||[]).filter(x=>x.status==='COMPLETE');
    const displayedActions=dashboardActionTab==='complete'?completedActions:nextActions;
    const actionList=displayedActions.length?`<div class="check-list">${displayedActions.map(a=>`<div class="check-item"><span>${badge(a.priority)}</span><label><strong>${esc(a.action||'Untitled action')}</strong><br><small>${esc(a.owner||'Unassigned')} · ${esc(a.due||'No due date')}</small></label>${badge(a.status)}</div>`).join('')}</div>`:`<div class="empty-state"><h3>${dashboardActionTab==='complete'?'No completed actions':'No open actions'}</h3><p>${dashboardActionTab==='complete'?'Completed actions will appear here.':'Add a next action to move the build forward.'}</p></div>`;
    const evidence=(p.tables.evidence||[]); const verified=evidence.filter(x=>x.status==='VERIFIED').length;
    const systemsComplete=completedSystemPhases(p)===systemPhases.length;
    const currentPhase=Math.min(systemsComplete?Number(p.meta.phase):Math.min(Number(p.meta.phase),3),6);
    const completedMilestones=Math.min(currentPhase,3)+completedSystemPhases(p)+(systemsComplete?1:0)+Math.max(0,currentPhase-4);
    return header('00','Command centre',`The live project picture: progress, ${costTrackingEnabled(p)?'money, ':''}evidence, risk and next work.`)+
      `<div class="dashboard-grid">
        <section class="card span-3 metric plum"><span class="metric-label">ACTIVE PROJECT</span><strong>${esc(p.meta.name)}</strong><span class="metric-note">${esc(p.meta.vehicle||'Vehicle details to enter')}</span></section>
        <section class="card span-3 metric cyan"><span class="metric-label">BUILD COMPLETION</span><strong>${progress}<small>%</small></strong><span class="metric-note">Checklist and work-package completion</span></section>
        ${costTrackingEnabled(p)?`<section class="card span-3 metric copper"><span class="metric-label">FORECAST COST</span><strong>${money(t.forecast||t.committed)}</strong><span class="metric-note">Paid ${money(t.paid)} · committed ${money(t.committed)}</span></section>`:''}
        <section class="card span-3 metric ${openIssues?'copper':'green'}"><span class="metric-label">OPEN ISSUES</span><strong>${openIssues}</strong><span class="metric-note">${openIssues?'Review blockers and unresolved changes':'No open issues recorded'}</span></section>
        ${card('Build phase',`<div class="phase-track">${phaseNames.map((name,i)=>{
          const done=(i<3&&i<currentPhase)||(i===3&&systemsComplete)||(i>3&&i<currentPhase);
          const active=i===currentPhase&&!done;
          const locked=i>currentPhase+1||(i>3&&!systemsComplete);
          return `<button class="phase ${i===3?'system-parent':''} ${done?'done':''} ${active?'active':''}" data-phase="${i}" ${locked?'disabled':''}><span>0${i+1}${done?'<small>DONE</small>':''}</span><strong>${name}</strong></button>`;
        }).join('')}</div>
        <div class="system-phase-track" aria-label="Systems rebuild work areas">${systemPhases.map(([id,name],i)=>{
          const done=p.meta.systemPhases?.[id]===true;
          const locked=!done&&(currentPhase<3||systemPhases.slice(0,i).some(([previous])=>p.meta.systemPhases?.[previous]!==true));
          return `<button class="system-phase ${done?'done':''}" data-system-phase="${id}" aria-pressed="${done}" ${locked?'disabled':''}><span>04.${i+1}</span><strong>${name}</strong><small>${done?'DONE':'MARK COMPLETE'}</small></button>`;
        }).join('')}</div>`,{span:'span-12',meta:`${completedMilestones} OF 10 MILESTONES COMPLETE`})}
        ${card('Project health',`<div class="progress-row"><div class="progress-ring" style="--progress:${progress}"><strong>${progress}%</strong></div><div class="progress-detail"><h3>${badge(p.meta.status)} &nbsp; ${badge(p.fields.identityStatus||'DRAFT')}</h3><p><b>Next milestone:</b> ${esc(p.fields.nextMilestone||'Not set')}<br><b>Next review:</b> ${esc(p.fields.nextReview||'Not set')}<br><b>Evidence verified:</b> ${verified} of ${evidence.length}</p></div></div>`,{span:'span-5'})}
        ${card('Next actions',`<div class="action-tabs" role="tablist" aria-label="Action lists"><button type="button" class="${dashboardActionTab==='open'?'active':''}" role="tab" aria-selected="${dashboardActionTab==='open'}" data-action-tab="open">Next actions (${nextActions.length})</button><button type="button" class="${dashboardActionTab==='complete'?'active':''}" role="tab" aria-selected="${dashboardActionTab==='complete'}" data-action-tab="complete">Complete (${completedActions.length})</button></div><div role="tabpanel">${actionList}</div>`,{span:'span-7',meta:`PLANNING & DECISIONS · ACTIONS · ${dashboardActionTab==='complete'?completedActions.length:`${nextActions.length} SHOWN`}`})}
        ${card('Project control',`<div class="form-grid">${field('Project name','name',{path:'meta'})}${field('Vehicle description','vehicle',{path:'meta'})}${field('Project code','code',{path:'meta'})}${field('Binder version','version',{path:'meta'})}${field('Project owner','owner',{path:'meta'})}${field('Project status','status',{path:'meta',options:fieldTypes.projectStatus})}${field('Master file location','binderLocation')}${field('Photo / media location','mediaLocation')}${field('Next milestone','nextMilestone',{span:'span-2'})}${field('Next review','nextReview',{type:'date'})}</div>`,{span:'span-12'})}
      </div>`;
  }

  function identity() {
    return header('01','Identity & history','Separate observed facts from claims, then preserve the source.')+
    `<div class="section-grid">
      ${card('Vehicle identity',`<div class="form-grid three">${field('Manufacturer','manufacturer')}${field('Model','model')}${field('Series','series')}${field('Body style','bodyStyle')}${field('Build date','buildDate')}${field('VIN / chassis number','vin')}${field('Registration','registration')}${field('Engine number','engineNumber')}${field('Transmission identifier','transmissionId')}${field('Paint code / original colour','paintCode')}${field('Trim code / original trim','trimCode')}${field('Odometer','odometer')}${field('Identity confidence','identityStatus',{type:'status'})}${field('History summary','historySummary',{type:'textarea',span:'span-2'})}</div>`,{span:'span-12'})}
      ${card('History of ownership',table('history'),{span:'span-12'})}
      ${card('Evidence register',table('evidence'),{span:'span-12'})}
      ${card('Identity photographs',photoGallery('identity'),{span:'span-12'})}
      <div class="callout warning" style="grid-column:span 12"><strong>Evidence standard</strong>Photograph identifiers in place, transcribe exactly and record their locations. If an identifier is unreadable, record that fact rather than guessing.</div>
    </div>`;
  }

  function baseline() {
    return header('02','Baseline Condition','Capture the starting point before dismantling, cleaning or replacing evidence.')+
    `<div class="section-grid">${card('Condition summary',table('condition'),{span:'span-12'})}${card('Immediate preservation & safety',checklist('baseline'),{span:'half'})}${card('Baseline photo survey',photoGallery('baseline'),{span:'half'})}<div class="callout warning" style="grid-column:span 12"><strong>Stop-work trigger</strong>If identity, structural safety, hazardous materials or legal ownership is uncertain, pause irreversible work and obtain appropriate specialist advice.</div></div>`;
  }

  function vision() {
    return header('03','Vision & Scope','Turn the dream into explicit choices that can be costed, built and verified.')+
    `<div class="section-grid">${card('Build brief',`<div class="form-grid">${field('Intended use','intendedUse')}${field('Restoration approach','approach',{options:fieldTypes.approach})}${field('Finish standard','finishStandard',{options:fieldTypes.finish})}${field('Authenticity priority','authenticity')}${field('Performance goal','performanceGoal')}${field('Reliability / serviceability goal','reliabilityGoal')}${field('Comfort / usability goal','comfortGoal')}${field('Non-negotiables','nonNegotiables',{type:'textarea'})}${field('Vision statement','visionStatement',{type:'textarea',span:'span-2'})}${field('Success statement','success',{type:'textarea',span:'span-2'})}</div>`,{span:'span-12'})}${card('Scope boundaries',`<div class="form-grid three">${field('In scope now','inScope',{type:'textarea'})}${field('Deferred / future','deferred',{type:'textarea'})}${field('Explicitly out of scope','outScope',{type:'textarea'})}</div>`,{span:'span-12'})}<div class="callout plum" style="grid-column:span 12"><strong>Restoration brief</strong>Define a documented, purpose-led restoration that meets the intended use. Preserve evidence before work and verify specification claims against reliable sources.</div></div>`;
  }

  function planning() {
    const actions=activeProject().tables.actions||[];
    const openActions=actions.filter(item=>item.status!=='COMPLETE');
    const completedActions=actions.filter(item=>item.status==='COMPLETE');
    return header('04','Planning & Decisions','Sequence work around evidence, dependencies, risk and irreversible choices.')+
    `<div class="section-grid">${card('Next actions',`<div class="action-tabs" role="tablist" aria-label="Action register"><button type="button" class="${actionRegisterTab==='open'?'active':''}" role="tab" aria-selected="${actionRegisterTab==='open'}" data-action-register-tab="open">Next actions (${openActions.length})</button><button type="button" class="${actionRegisterTab==='complete'?'active':''}" role="tab" aria-selected="${actionRegisterTab==='complete'}" data-action-register-tab="complete">Complete (${completedActions.length})</button></div><div role="tabpanel">${table('actions')}</div>`,{span:'span-12'})}${card('Decision register',table('decisions'),{span:'span-12'})}${card('Risk register',table('risks'),{span:'span-12'})}<div class="callout warning" style="grid-column:span 12"><strong>Approval gate</strong>Record a decision before changing identity, cutting structure, deleting original features, ordering high-value custom parts or applying final finish.</div></div>`;
  }

  function disassembly() {
    return header('05','Disassembly & Parts','Make every removed item findable, identifiable and re-installable.')+
    `<div class="section-grid">${card('Tagging convention',`<div class="form-grid">${field('Project prefix','tagPrefix')}${field('Area codes','areaCodes')}${field('Container label format','containerFormat')}${field('Tag example','tagExample',{placeholder:'e.g. WPXA-BDY-001'})}</div>`,{span:'half'})}${card('Removal discipline',checklist('disassembly'),{span:'half'})}${card('Parts inventory & storage map',table('inventory','Parts inventory','No parts have been catalogued yet'),{span:'span-12'})}${card('Disassembly log',table('disassemblyLog','Areas / parts disassembled','No disassembly records yet'),{span:'span-12'})}${card('Disassembly photos',photoGallery('disassembly'),{span:'span-12'})}<div class="callout" style="grid-column:span 12"><strong>Loss prevention</strong>Do not use “miscellaneous” as a permanent category. Every loose fastener, bracket, clip and shim should inherit the assembly tag.</div></div>`;
  }

  function body() {
    return header('06','Body, Shell & Paint','Document structure first; decide finish after fit and repair strategy are understood.')+
    `<div class="section-grid">${card('Body & structural assessment',table('body'),{span:'span-12'})}${card('Rust repair register',table('rustRepairs','Rust repair register','No rust repairs recorded yet'),{span:'span-12'})}${card('Paint & finish direction',`<div class="form-grid">${field('Colour / finish direction','colourDirection')}${field('Code / formula','paintCode')}${field('Paint system / brand','paintSystem')}${field('Gloss / texture target','glossTarget')}${field('Underbody / cavity protection','protection')}${field('Decision status','bodyPaintStatus',{options:fieldTypes.status})}</div>`,{span:'half'})}${card('Finish evidence',photoGallery('body'),{span:'half'})}<div class="callout warning" style="grid-column:span 12"><strong>Hold point</strong>Complete structural inspection, trial assembly and panel-gap approval before final paint preparation.</div></div>`;
  }

  function chassis() {
    return header('07','Chassis, Brakes & Wheels','Control safety-critical components with measurements, sources and verification.')+
    `<div class="section-grid">${card('System build record',table('chassis'),{span:'span-12'})}${card('Chassis parts',table('chassisParts','Chassis parts','No chassis parts recorded yet'),{span:'span-12'})}<div class="callout warning" style="grid-column:span 12"><strong>Safety record</strong>Torque values and procedures must come from an identified authoritative source or qualified specialist. Record the source in the reference library.</div></div>`;
  }

  function powertrain() {
    return header('08','Engine and Driveline','Connect specification, machine work, parts, clearances, setup and test results.')+
    `<div class="section-grid">${card('Major assembly identity',`<div class="form-grid three">${field('Engine / assembly ID','engineId')}${field('Transmission ID','transmissionBuildId')}${field('Differential / axle ID','axleId')}${field('Builder / specialist','builder')}${field('Target use / output','targetOutput')}${field('Build sheet location','buildSheet')}</div>`,{span:'span-12'})}${card('Engine & Driveline',table('powertrain'),{span:'span-12'})}<div class="callout warning" style="grid-column:span 12"><strong>Source discipline</strong>Do not copy critical clearances, capacities or torque values without naming the manual, data sheet or specialist that supplied them.</div></div>`;
  }

  function electrical() {
    return header('09','Electrical & Parts','Create a serviceable system whose routes, loads, protection and changes are documented.')+
    `<div class="section-grid">${card('Electrical architecture',`<div class="form-grid three">${field('System voltage','voltage')}${field('Battery location / type','battery')}${field('Main protection','mainProtection')}${field('Earth strategy','earthStrategy')}${field('Harness approach','harness')}${field('Diagram location','diagram')}</div>`,{span:'span-12'})}${card('Circuit register',table('circuits'),{span:'span-12'})}${card('Electrical parts',table('electricalParts','Electrical parts','No electrical parts recorded yet'),{span:'span-12'})}${card('Electrical photos',photoGallery('electrical'),{span:'span-12'})}<div class="callout warning" style="grid-column:span 12"><strong>Change control</strong>Every non-original circuit should have a purpose, protection rating, route, wire identification, earth point and updated diagram.</div></div>`;
  }

  function interior() {
    return header('10','Interior, Trim & Glass','Record appearance, materials, fit, provenance and water-management details.')+
    `<div class="section-grid">${card('Interior / trim build record',table('trim'),{span:'span-12'})}${card('Reference photographs',photoGallery('interior'),{span:'span-12'})}<div class="callout" style="grid-column:span 12"><strong>Assembly sequence</strong>Trial-fit trim, glass, mechanisms and seals early enough to resolve holes, clips, clearances and water paths before final finishes become vulnerable.</div></div>`;
  }

  function commercial() {
    const p=activeProject();
    const t=totals();
    return header('11','Parts & Budget','Connect every purchase to scope, provenance, fit and financial control.')+
    `<div class="dashboard-grid">
      ${costTrackingEnabled(p)?`
      <section class="card span-3 metric"><span class="metric-label">APPROVED BUDGET</span><strong>${money(t.budget)}</strong><span class="metric-note">Current category total</span></section>
      <section class="card span-3 metric copper"><span class="metric-label">COMMITTED</span><strong>${money(t.committed)}</strong><span class="metric-note">Orders and approved work</span></section>
      <section class="card span-3 metric"><span class="metric-label">PAID</span><strong>${money(t.paid)}</strong><span class="metric-note">Recorded actual spend</span></section>
      <section class="card span-3 metric cyan"><span class="metric-label">FORECAST</span><strong>${money(t.forecast)}</strong><span class="metric-note">Expected total at completion</span></section>
      ${card('Budget summary',table('budget'),{span:'span-12'})}`:`<div class="callout" style="grid-column:span 12"><strong>Cost tracking is off</strong>Cost fields and totals are hidden for this project. You can turn them back on in the Binder design lab.</div>`}
      ${card('Parts',table('parts','Parts','No parts recorded yet'),{span:'span-12'})}
      ${card('Specialist Repairs',table('specialistRepairs','Specialist Repairs','No specialist repairs recorded yet'),{span:'span-12'})}
      ${card('Consumables register',table('consumables','Consumables','No consumables recorded yet'),{span:'span-12'})}
      ${card('Part acceptance checklist',checklist('acceptance'),{span:'span-12'})}
    </div>`;
  }

  function worklog() {
    const p=activeProject();
    const t=totals();
    return header('12','Work, Issues & Milestones','Create a chronological record that explains what changed, why and how it was verified.')+
    `<div class="section-grid">${card('Work log',table('worklog','Work log','No work entries recorded yet'),{span:'span-12',meta:costTrackingEnabled(p)?`<span data-labor-total>LABOUR TOTAL ${money(t.labor)}</span>`:''})}${card('Issue / defect / change log',table('issues','Issues','No issues recorded'),{span:'span-12'})}${card('Milestone photographs',photoGallery('milestones'),{span:'span-12'})}<div class="callout" style="grid-column:span 12"><strong>Close-out standard</strong>An issue is closed only when the completed action and verification evidence are recorded—not merely when work starts.</div></div>`;
  }

  function handover() {
    return header('13','Compliance & Handover','Prove the finished vehicle is safe, legal for its intended use and understandable to its next custodian.')+
    `<div class="section-grid">${card('Compliance & inspection register',table('compliance'),{span:'span-12'})}${card('Pre-start hold point',checklist('prestart'),{span:'half'})}${card('Handover pack',checklist('handover'),{span:'half'})}${card('Commissioning & road-test plan',table('tests'),{span:'span-12'})}<div class="callout warning" style="grid-column:span 12"><strong>Jurisdiction note</strong>Requirements vary by vehicle, modifications, intended use and location. Record advice from the relevant authority or qualified specialist.</div></div>`;
  }

  function library() {
    return header('14','Reference Library','Make every technical claim, purchase and approval traceable to its source.')+
    `<div class="section-grid">${card('Reference register',table('references','References','No reference documents indexed yet'),{span:'span-12'})}${card('Library rules',`<div class="callout"><strong>Link resilience</strong>Prefer stable cloud links and consistent filenames. If files move, update the register as part of the same change.</div><div class="callout warning" style="margin-top:12px"><strong>Authority</strong>Mark the document version, publication date or specialist. A source without identity is difficult to verify later.</div>`,{span:'span-12'})}</div>`;
  }

  function design() {
    const p=activeProject();
    return header('DL','Binder design lab','Refine the screen experience and content before a dedicated printable edition is designed.')+
    `<div class="section-grid">${card('Screen density',`<div class="design-options"><button class="option-tile ${p.preferences.density==='standard'?'selected':''}" data-preference="density" data-value="standard"><strong>Workshop standard</strong><small>Balanced spacing for laptop and desktop use.</small><div class="option-swatch"></div></button><button class="option-tile ${p.preferences.density==='compact'?'selected':''}" data-preference="density" data-value="compact"><strong>Compact control</strong><small>More records on screen with tighter vertical rhythm.</small><div class="option-swatch"></div></button></div>`,{span:'half'})}${card('Accessibility & contrast',`<div class="design-options"><button class="option-tile ${p.preferences.contrast==='standard'?'selected':''}" data-preference="contrast" data-value="standard"><strong>Blueprint</strong><small>Original technical-drawing palette.</small><div class="option-swatch"></div></button><button class="option-tile ${p.preferences.contrast==='high'?'selected':''}" data-preference="contrast" data-value="high"><strong>High contrast</strong><small>Brighter lines and secondary text.</small><div class="option-swatch"></div></button></div>`,{span:'half'})}${card('Cost tracking',`<div class="design-options"><button class="option-tile ${costTrackingEnabled(p)?'selected':''}" data-preference="costTracking" data-value="true"><strong>Show costs</strong><small>Display budget, purchase and labour cost fields and totals.</small></button><button class="option-tile ${costTrackingEnabled(p)?'':'selected'}" data-preference="costTracking" data-value="false"><strong>Hide costs</strong><small>Hide cost fields and totals throughout this project.</small></button></div>`,{span:'half'})}${card('Refinement notes',`<div class="form-grid">${field('What feels useful?','designUseful',{type:'textarea'})}${field('What feels unnecessary?','designRemove',{type:'textarea'})}${field('What is missing?','designMissing',{type:'textarea'})}${field('What needs more detail?','designDetail',{type:'textarea'})}${field('Overall notes for next version','designNotes',{type:'textarea',span:'span-2'})}</div>`,{span:'span-12'})}${card('Change requests',table('refinements','Change requests','No design changes requested yet'),{span:'span-12'})}<div class="callout" style="grid-column:span 12"><strong>Version principle</strong>Refine the digital structure and content first. Page efficiency, print margins, duplex behaviour and low-ink styling belong to the later printable edition.</div></div>`;
  }

  const renderers={dashboard,identity,baseline,vision,planning,disassembly,body,chassis,powertrain,electrical,interior,commercial,worklog,handover,library,design};

  function autoGrowTextarea(textarea) {
    if(!textarea || textarea.tagName!=='TEXTAREA') return;
    textarea.style.height='auto';
    const minHeight=textarea.classList.contains('auto-grow-compact')?24:72;
    textarea.style.height=`${Math.max(textarea.scrollHeight,minHeight)}px`;
  }

  function initialiseAutoGrow(root=document) {
    root.querySelectorAll('textarea').forEach(autoGrowTextarea);
  }

  function render(preserveScroll=false) {
    const scrollTop=window.scrollY;
    updateProjectChrome(); renderNav();
    app.innerHTML=(renderers[activeSection]||dashboard)();
    window.scrollTo({top:preserveScroll?scrollTop:0,behavior:'instant'});
    $('#workspace').focus({preventScroll:true});
    requestAnimationFrame(()=>initialiseAutoGrow(app));
  }

  function openModal(kicker,title,content,footer='') {
    $('#modal').classList.remove('photo-preview');
    $('#modalKicker').textContent=kicker; $('#modalTitle').textContent=title; $('#modalContent').innerHTML=content; $('#modalFooter').innerHTML=footer;
    $('#modalBackdrop').hidden=false; document.body.style.overflow='hidden';
    setTimeout(()=>$('#modalContent').querySelector('input,select,textarea,button')?.focus(),20);
  }

  function electricalPhotoPicker(rowId) {
    const photos=activeProject().photoGalleries.electrical||[];
    const part=activeProject().tables.electricalParts.find(item=>item._id===rowId);
    if(!part) return;
    const choices=photos.map(photo=>`<button class="electrical-photo-choice" type="button" data-electrical-photo-choose="${esc(rowId)}" data-photo-id="${esc(photo.id)}"><img src="${photo.dataUrl}" alt=""><span>${esc(photo.caption||photo.name||'Untitled photo')}</span></button>`).join('');
    openModal('ELECTRICAL PART','Add or link a photo',`<div class="electrical-photo-picker">${choices||'<p class="photo-gallery-empty">No electrical photos added yet.</p>'}</div>`,`<button class="button ghost" data-modal-close>Cancel</button>${part.photoId?`<button class="button ghost" data-electrical-photo-clear="${esc(rowId)}">Unlink photo</button>`:''}<button class="button primary" data-electrical-photo-add>＋ Add photo</button>`);
  }

  function closeModal() {
    $('#modalBackdrop').hidden=true;
    $('#modal').classList.remove('photo-preview');
    document.body.style.overflow='';
    if(pendingProjectImage){ pendingProjectImage.bitmap.close(); pendingProjectImage=null; }
  }

  function newProjectModal() {
    const trackCosts=costTrackingEnabled();
    openModal('NEW RESTORATION','Create a new project',`<div class="form-grid"><div class="field"><label>Project name</label><input id="newProjectName" placeholder="e.g. Dad’s FJ Holden"></div><div class="field"><label>Vehicle description</label><input id="newProjectVehicle" placeholder="Year / make / model / body"></div><div class="field"><label>Project code</label><input id="newProjectCode" placeholder="e.g. FJH-001"></div><div class="field"><label>Start from</label><select id="newProjectSource"><option value="blank">Clean reusable template</option><option value="prepopulated">Generic restoration starter — pre-filled lists, no vehicle details</option><option value="clone">Clone current project structure and data</option></select></div><div class="field"><label for="newProjectCostTracking">Cost tracking</label><select id="newProjectCostTracking"><option value="true" ${trackCosts?'selected':''}>On — show cost fields and totals</option><option value="false" ${trackCosts?'':'selected'}>Off — hide costs</option></select></div></div><div class="callout" style="margin-top:14px"><strong>Choose your starting point</strong>The generic restoration starter includes common work areas, system registers, test stages and actions, without vehicle-specific information. You can change cost tracking later in the Binder design lab.</div>`,`<button class="button ghost" data-modal-close>Cancel</button><button class="button primary" id="createProjectConfirm">Create project</button>`);
  }

  function dataModal() {
    const p=activeProject();
    openModal('DATA & BACKUP','Own the project record',`<div class="section-grid"><div class="card half"><div class="card-body"><h3>Export backup</h3><p style="color:var(--muted)">Download all projects, fields, registers and preferences as JSON. Embedded photos may make the file large.</p><button class="button primary" data-export="all">Export all projects</button></div></div><div class="card half"><div class="card-body"><h3>Import backup</h3><p style="color:var(--muted)">Import a Build Binder JSON backup. Existing projects are preserved unless the imported IDs match.</p><label class="button ghost" for="importFile">Choose JSON file</label><input hidden id="importFile" type="file" accept="application/json"></div></div><div class="card span-12"><div class="card-body"><h3>Current project</h3><p><b>${esc(p.meta.name)}</b> · updated ${esc(p.meta.updated)} · ${(new Blob([JSON.stringify(p)]).size/1024).toFixed(1)} KB of local data</p><button class="button ghost" data-export="project">Export current project</button> ${p.meta.showcase?'':'<button class="button danger" id="deleteProjectButton">Delete current project</button>'}</div></div></div>`,`<button class="button ghost" data-modal-close>Close</button>`);
  }

  function commandModal() {
    openModal('COMMAND PALETTE','Jump to a binder section',`<div class="field"><label>Search sections</label><input id="commandSearch" placeholder="Type a section name…" autocomplete="off"></div><div class="command-list" id="commandList">${sectionDefs.map(s=>`<button class="command-item" data-command-section="${s.id}"><span class="command-index">${s.index}</span><span><strong>${s.label}</strong><small>${s.group}</small></span><kbd>↵</kbd></button>`).join('')}</div>`,`<button class="button ghost" data-modal-close>Close</button>`);
  }

  function quickAddModal() {
    openModal('QUICK CAPTURE','Add a project record',`<div class="form-grid"><div class="field"><label>Record type</label><select id="quickType"><option value="actions">Action</option><option value="issues">Issue / defect</option><option value="inventory">Part / inventory item</option><option value="worklog">Work log entry</option><option value="evidence">Evidence item</option><option value="parts">Part</option><option value="specialistRepairs">Specialist repair</option><option value="consumables">Consumable</option></select></div><div class="field"><label>Short description</label><input id="quickDescription" placeholder="What needs to be recorded?"></div><div class="field"><label>Owner / by</label><input id="quickOwner" placeholder="Optional"></div><div class="field"><label>Date / due</label><input id="quickDate" type="date" value="${today()}"></div></div>`,`<button class="button ghost" data-modal-close>Cancel</button><button class="button primary" id="quickAddConfirm">Add record</button>`);
  }

  function quickAdd() {
    const type=$('#quickType').value, desc=$('#quickDescription').value.trim(), owner=$('#quickOwner').value.trim(), date=$('#quickDate').value;
    if(!desc) return toast('Description required','Enter a short description first.');
    const p=activeProject(); let data;
    if(type==='actions') data={...tableSchemas.actions.blank,action:desc,owner,due:date};
    if(type==='issues') data={...tableSchemas.issues.blank,id:`ISS-${String((p.tables.issues?.length||0)+1).padStart(3,'0')}`,issue:desc,owner};
    if(type==='inventory') data={...tableSchemas.inventory.blank,tag:`${p.fields.tagPrefix||'PART'}-${String((p.tables.inventory?.length||0)+1).padStart(3,'0')}`,part:desc};
    if(type==='worklog') data={...tableSchemas.worklog.blank,date,work:desc,by:owner};
    if(type==='evidence') data={...tableSchemas.evidence.blank,id:`EV-${String((p.tables.evidence?.length||0)+1).padStart(3,'0')}`,item:desc,source:owner};
    if(type==='parts') data={...tableSchemas.parts.blank,id:`P-${String((p.tables.parts?.length||0)+1).padStart(3,'0')}`,item:desc,supplier:owner,ordered:date};
    if(type==='specialistRepairs') data={...tableSchemas.specialistRepairs.blank,id:`SR-${String((p.tables.specialistRepairs?.length||0)+1).padStart(3,'0')}`,item:desc,supplier:owner,ordered:date};
    if(type==='consumables') data={...tableSchemas.consumables.blank,id:`C-${String((p.tables.consumables?.length||0)+1).padStart(3,'0')}`,item:desc,supplier:owner,ordered:date};
    p.tables[type]=p.tables[type]||[]; p.tables[type].push(row(data)); queueSave('Quick record added'); closeModal(); render();
  }

  function exportJson(scope) {
    const payload=scope==='project'?{format:'the-build-binder-project',version:APP_VERSION,exported:new Date().toISOString(),project:activeProject()}:{format:'the-build-binder-backup',version:APP_VERSION,exported:new Date().toISOString(),state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=`${slug(activeProject().meta.name||'build-binder')}-${scope==='project'?'project':'backup'}-${today()}.json`; a.click(); URL.revokeObjectURL(url); toast('Backup created',a.download);
  }

  async function importJson(file) {
    try {
      const data=JSON.parse(await file.text());
      if(data.format==='the-build-binder-backup' && data.state?.projects) { state=data.state; state.projects.forEach(ensureProjectShape); }
      else if(data.format==='the-build-binder-project' && data.project) {
        ensureProjectShape(data.project);
        const i=state.projects.findIndex(p=>p.id===data.project.id); if(i>=0) state.projects[i]=data.project; else state.projects.push(data.project); state.activeProjectId=data.project.id;
      } else throw new Error('Not a Build Binder backup');
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); closeModal(); render(); toast('Import complete','The binder data has been restored.');
    } catch(err) { toast('Import failed',err.message); }
  }

  async function compressPhoto(file) {
    if(file.type&&!file.type.startsWith('image/')) throw new Error(`${file.name}: choose an image file.`);
    if(file.size>15*1024*1024) throw new Error(`${file.name}: the image is larger than 15 MB.`);
    let bitmap;
    try {
      bitmap=await createImageBitmap(file);
    } catch {
      throw new Error(`${file.name}: this image format is not supported by your browser. Try another image format.`);
    }
    try {
      const max=1400; const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const ctx=canvas.getContext('2d');
      if(!ctx) throw new Error(`${file.name}: the image could not be processed.`);
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      return { id:uid('photo'), dataUrl:canvas.toDataURL('image/webp',.76), name:file.name, caption:'', type:file.type, width:canvas.width, height:canvas.height, added:new Date().toISOString() };
    } finally {
      bitmap.close();
    }
  }

  function projectImageCrop(bitmap,zoom,x,y,width,height) {
    const targetRatio=16/8.5;
    let cropWidth=Math.min(bitmap.width,bitmap.height*targetRatio);
    let cropHeight=cropWidth/targetRatio;
    cropWidth/=zoom;
    cropHeight/=zoom;
    const left=(bitmap.width-cropWidth)*x;
    const top=(bitmap.height-cropHeight)*y;
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;
    const context=canvas.getContext('2d');
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    context.drawImage(bitmap,left,top,cropWidth,cropHeight,0,0,width,height);
    return canvas;
  }

  function updateProjectImageCropPreview() {
    if(!pendingProjectImage) return;
    const zoom=Number($('#projectImageZoom').value);
    const x=Number($('#projectImageX').value)/100;
    const y=Number($('#projectImageY').value)/100;
    const canvas=projectImageCrop(pendingProjectImage.bitmap,zoom,x,y,480,255);
    $('#projectImageCropPreview').src=canvas.toDataURL('image/webp',.82);
  }

  async function prepareProjectImage(file) {
    if(file.type&&!file.type.startsWith('image/')) throw new Error('Choose an image file.');
    if(file.size>10*1024*1024) throw new Error('The image must be smaller than 10 MB.');
    let bitmap;
    try {
      bitmap=await createImageBitmap(file);
    } catch {
      throw new Error('This image format is not supported by your browser. Try another image format.');
    }
    pendingProjectImage={bitmap,name:file.name,type:file.type};
    openModal('PROJECT IMAGE','Crop project image',`<div class="project-image-crop"><div class="project-image-crop-frame"><img id="projectImageCropPreview" alt="Project image crop preview"></div><div class="project-image-crop-controls"><label>Zoom <input id="projectImageZoom" data-crop-control type="range" min="1" max="3" step="0.01" value="1"></label><label>Horizontal position <input id="projectImageX" data-crop-control type="range" min="0" max="100" value="50"></label><label>Vertical position <input id="projectImageY" data-crop-control type="range" min="0" max="100" value="50"></label></div></div>`,`<button class="button ghost" data-modal-close>Cancel</button><button class="button primary" id="saveProjectImageCrop">Use cropped image</button>`);
    updateProjectImageCropPreview();
  }

  document.addEventListener('click', async e=>{
    if(e.target.closest('#saveProjectImageCrop')){
      if(!pendingProjectImage) return;
      const original=activeProject().projectImage;
      const {bitmap,name,type}=pendingProjectImage;
      const crop=projectImageCrop(bitmap,Number($('#projectImageZoom').value),Number($('#projectImageX').value)/100,Number($('#projectImageY').value)/100,1200,638);
      const image={dataUrl:crop.toDataURL('image/webp',.88),name,type,width:crop.width,height:crop.height,updated:new Date().toISOString()};
      bitmap.close();
      pendingProjectImage=null;
      activeProject().projectImage=image;
      if(!persistStateNow('',false)) activeProject().projectImage=original;
      else toast('Project image updated','The cropped image is stored locally with this project.');
      closeModal();
      updateProjectChrome();
    }
    const photoPreview=e.target.closest('[data-photo-preview]');
    if(photoPreview){
      const gallery=photoPreview.dataset.photoPreview;
      const photo=activeProject().photoGalleries[gallery]?.find(item=>item.id===photoPreview.dataset.photoId);
      if(photo){
        const caption=photo.caption||photo.name||'Project photo';
        openModal('PHOTO PREVIEW',caption,`<img class="photo-preview-image" src="${photo.dataUrl}" alt="${esc(caption)}">`,'<button class="button ghost" data-modal-close>Close</button>');
        $('#modal').classList.add('photo-preview');
      }
    }
    const electricalPhotoPickerButton=e.target.closest('[data-electrical-photo-picker]');
    if(electricalPhotoPickerButton) electricalPhotoPicker(electricalPhotoPickerButton.dataset.electricalPhotoPicker);
    const electricalPhotoChoice=e.target.closest('[data-electrical-photo-choose]');
    if(electricalPhotoChoice){
      const part=activeProject().tables.electricalParts.find(item=>item._id===electricalPhotoChoice.dataset.electricalPhotoChoose);
      if(part){
        part.photoId=electricalPhotoChoice.dataset.photoId;
        queueSave('Electrical part photo linked');
        closeModal();
        render();
      }
    }
    const electricalPhotoClear=e.target.closest('[data-electrical-photo-clear]');
    if(electricalPhotoClear){
      const part=activeProject().tables.electricalParts.find(item=>item._id===electricalPhotoClear.dataset.electricalPhotoClear);
      if(part){
        part.photoId='';
        queueSave('Electrical part photo unlinked');
        closeModal();
        render();
      }
    }
    if(e.target.closest('[data-electrical-photo-add]')){
      closeModal();
      $('#add-gallery-electrical').click();
    }
    const actionTab=e.target.closest('[data-action-tab]');
    if(actionTab){
      dashboardActionTab=actionTab.dataset.actionTab;
      render(true);
    }
    const actionRegisterTabButton=e.target.closest('[data-action-register-tab]');
    if(actionRegisterTabButton){
      actionRegisterTab=actionRegisterTabButton.dataset.actionRegisterTab;
      render(true);
    }
    const section=e.target.closest('[data-section]'); if(section){ activeSection=section.dataset.section; location.hash=activeSection; $('#sidebar').classList.remove('open'); render(); }
    if(e.target.closest('[data-action="quick-add"]')||e.target.closest('#quickAddButton')) quickAddModal();
    if(e.target.closest('[data-action="print"]')||e.target.closest('#printButton')) window.print();
    if(e.target.closest('#newProjectButton')) newProjectModal();
    if(e.target.closest('#dataButton')) dataModal();
    if(e.target.closest('#commandButton')) commandModal();
    if(e.target.closest('#menuToggle')) $('#sidebar').classList.toggle('open');
    if(e.target.closest('#modalClose')||e.target.closest('[data-modal-close]')||e.target=== $('#modalBackdrop')) closeModal();
    const checklistEdit=e.target.closest('[data-checklist-edit]');
    if(checklistEdit){ const name=checklistEdit.dataset.checklistEdit; editableChecklists.has(name)?editableChecklists.delete(name):editableChecklists.add(name); render(); }
    const checklistAdd=e.target.closest('[data-checklist-add]');
    if(checklistAdd){
      const name=checklistAdd.dataset.checklistAdd;
      const input=$(`[data-checklist-new="${name}"]`);
      const label=input.value.trim();
      if(!label){ toast('Checklist item required','Enter a label before adding an item.'); input.focus(); return; }
      activeProject().checklists[name].push({label,done:false});
      queueSave('Checklist item added');
      render();
    }
    const checklistRemove=e.target.closest('[data-checklist-remove]');
    if(checklistRemove){
      const name=checklistRemove.dataset.checklistRemove;
      activeProject().checklists[name].splice(Number(checklistRemove.dataset.index),1);
      queueSave('Checklist item removed');
      render();
    }
    const add=e.target.closest('[data-add-row]'); if(add){ const name=add.dataset.addRow; activeProject().tables[name].push(row(clone(tableSchemas[name].blank))); queueSave('Row added'); render(); }
    const del=e.target.closest('[data-delete-row]'); if(del){ const tr=del.closest('tr'); const name=del.dataset.deleteRow; activeProject().tables[name]=activeProject().tables[name].filter(r=>r._id!==tr.dataset.row); queueSave('Row deleted'); render(); }
    const systemPhase=e.target.closest('[data-system-phase]');
    if(systemPhase&&!systemPhase.disabled){
      const p=activeProject();
      p.meta.systemPhases=p.meta.systemPhases||{};
      const id=systemPhase.dataset.systemPhase;
      p.meta.systemPhases[id]=p.meta.systemPhases[id]!==true;
      if(completedSystemPhases(p)===systemPhases.length&&Number(p.meta.phase)<4) p.meta.phase=4;
      if(completedSystemPhases(p)<systemPhases.length&&Number(p.meta.phase)>3) p.meta.phase=3;
      queueSave('Systems rebuild progress updated');
      render();
    }
    const phase=e.target.closest('[data-phase]');
    if(phase&&!phase.disabled){
      const p=activeProject();
      const selectedPhase=Number(phase.dataset.phase);
      const systemsComplete=completedSystemPhases(p)===systemPhases.length;
      const currentPhase=Math.min(systemsComplete?Number(p.meta.phase):Math.min(Number(p.meta.phase),3),6);
      p.meta.phase=selectedPhase===currentPhase&&currentPhase===5?6:selectedPhase;
      queueSave('Build phase updated');
      render();
    }
    const pref=e.target.closest('[data-preference]'); if(pref){ activeProject().preferences[pref.dataset.preference]=pref.dataset.preference==='costTracking'?pref.dataset.value==='true':pref.dataset.value; queueSave('Display preference updated'); render(); }
    const galleryRemove=e.target.closest('[data-gallery-remove]');
    if(galleryRemove){
      const gallery=galleryRemove.dataset.galleryRemove;
      const photo=activeProject().photoGalleries[gallery]?.find(item=>item.id===galleryRemove.dataset.photoId);
      openModal('REMOVE PHOTO','Are you sure you want to remove this photo?',`<p>${esc(photo?.caption||photo?.name||'This photo')} will be removed from this project.</p>`,`<button class="button ghost" data-modal-close>Cancel</button><button class="button danger" data-confirm-photo-remove="${esc(gallery)}" data-photo-id="${esc(galleryRemove.dataset.photoId)}">Remove photo</button>`);
    }
    const confirmPhotoRemove=e.target.closest('[data-confirm-photo-remove]');
    if(confirmPhotoRemove){
      const gallery=confirmPhotoRemove.dataset.confirmPhotoRemove;
      const photoId=confirmPhotoRemove.dataset.photoId;
      const project=activeProject();
      project.photoGalleries[gallery]=project.photoGalleries[gallery].filter(photo=>photo.id!==photoId);
      if(gallery==='electrical') (project.tables.electricalParts||[]).forEach(part=>{ if(part.photoId===photoId) part.photoId=''; });
      if(gallery==='disassembly') (project.tables.disassemblyLog||[]).forEach(record=>{ if(record.photoId===photoId) record.photoId=''; });
      queueSave('Photo removed');
      closeModal();
      render();
    }
    if(e.target.closest('#projectImageRemove')){
      activeProject().projectImage=null;
      $('#projectImageInput').value='';
      queueSave('Project image removed');
      updateProjectChrome();
    }
    const cmd=e.target.closest('[data-command-section]'); if(cmd){ activeSection=cmd.dataset.commandSection; location.hash=activeSection; closeModal(); render(); }
    if(e.target.closest('#createProjectConfirm')){
      const name=$('#newProjectName').value.trim()||'Untitled restoration'; const vehicle=$('#newProjectVehicle').value.trim()||'Vehicle details to enter';
      const source=$('#newProjectSource').value;
      let p=source==='clone'?clone(activeProject()):source==='prepopulated'?prepopulatedGenericProject(name,vehicle):genericProject(name,vehicle);
      p.preferences.costTracking=$('#newProjectCostTracking').value==='true';
      p.id=uid('project'); p.meta.name=name; p.meta.vehicle=vehicle; p.meta.code=$('#newProjectCode').value.trim()||'NEW-001'; p.meta.showcase=false; p.meta.updated=today();
      state.projects.push(p); state.activeProjectId=p.id; localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); closeModal(); activeSection='dashboard'; location.hash='dashboard'; render(); toast('Project created',`${name} is ready.`);
    }
    if(e.target.closest('#quickAddConfirm')) quickAdd();
    const exp=e.target.closest('[data-export]'); if(exp) exportJson(exp.dataset.export);
    if(e.target.closest('#deleteProjectButton')){
      const p=activeProject(); if(confirm(`Delete ${p.meta.name}? Export a backup first if it must be retained.`)){ state.projects=state.projects.filter(x=>x.id!==p.id); state.activeProjectId=state.projects[0].id; localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); closeModal(); render(); toast('Project deleted','The local project was removed.'); }
    }
  });

  document.addEventListener('input', e=>{
    if(e.target.matches('textarea')) autoGrowTextarea(e.target);
    if(e.target.matches('[data-crop-control]')) updateProjectImageCropPreview();
    if(e.target.matches('[data-field]')){
      const p=activeProject(); const source=e.target.dataset.path==='meta'?p.meta:p.fields; source[e.target.dataset.field]=e.target.value; queueSave('Field updated');
    }
    if(e.target.matches('[data-table]')){
      const rowEl=e.target.closest('tr'); const table=e.target.dataset.table; const r=activeProject().tables[table].find(x=>x._id===rowEl.dataset.row); if(r){r[e.target.dataset.key]=e.target.value;queueSave('Register updated');}
      if(table==='worklog'){
        const total=app.querySelector('.card-header [data-labor-total]');
        if(total) total.textContent=`LABOUR TOTAL ${money(totals().labor)}`;
      }
    }
    if(e.target.matches('[data-gallery-caption]')){
      const gallery=e.target.dataset.galleryCaption;
      const photo=activeProject().photoGalleries[gallery]?.find(item=>item.id===e.target.dataset.photoId);
      if(photo){
        photo.caption=e.target.value;
        queueSave('Photo caption updated');
        app.querySelectorAll(`[data-condition-photo-select] option[value="${photo.id}"]`).forEach(option=>option.textContent=photo.caption||photo.name||'Untitled photo');
        app.querySelectorAll(`[data-electrical-photo-label][data-photo-id="${photo.id}"]`).forEach(label=>label.textContent=photo.caption||photo.name||'View photo');
        app.querySelectorAll(`[data-disassembly-photo-link] option[value="${photo.id}"]`).forEach(option=>option.textContent=photo.caption||photo.name||'Untitled photo');
      }
    }
    if(e.target.matches('[data-checklist-label]')){
      const checklist=activeProject().checklists[e.target.dataset.checklistLabel];
      const item=checklist?.[Number(e.target.dataset.index)];
      if(item){ item.label=e.target.value; queueSave('Checklist item updated'); }
    }
    if(e.target.id==='commandSearch'){
      const q=e.target.value.toLowerCase(); document.querySelectorAll('[data-command-section]').forEach(x=>x.hidden=!x.textContent.toLowerCase().includes(q));
    }
  });

  document.addEventListener('change', async e=>{
    if(e.target.matches('[data-checklist]')){ const x=activeProject().checklists[e.target.dataset.checklist][Number(e.target.dataset.index)]; x.done=e.target.checked; queueSave('Checklist updated'); render(true); }
    if(e.target.matches('[data-photo-conditions]')){
      const photo=activeProject().photoGalleries.baseline.find(item=>item.id===e.target.dataset.photoId);
      if(photo){
        photo.conditionIds=e.target.value?[e.target.value]:[];
        queueSave('Photo condition links updated');
        render(true);
      }
    }
    if(e.target.matches('[data-condition-photo-select]')&&e.target.value){
      document.getElementById(`photo-${e.target.value}`)?.scrollIntoView({behavior:'smooth',block:'center'});
      e.target.value='';
    }
    if(e.target.matches('[data-disassembly-photo-link]')){
      const rowEl=e.target.closest('tr');
      const record=activeProject().tables.disassemblyLog.find(item=>item._id===rowEl.dataset.row);
      if(record){
        record.photoId=e.target.value;
        queueSave('Disassembly photo link updated');
        if(record.photoId) document.getElementById(`photo-${record.photoId}`)?.scrollIntoView({behavior:'smooth',block:'center'});
      }
    }
    if(e.target===projectSelect){ state.activeProjectId=e.target.value; localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); render(); toast('Project switched',activeProject().meta.name); }
    if(e.target.id==='importFile' && e.target.files[0]) importJson(e.target.files[0]);
    if(e.target.matches('[data-gallery-add]') && e.target.files.length){
      const gallery=e.target.dataset.galleryAdd;
      const files=[...e.target.files];
      let saved=0;
      for(const file of files){
        try {
          const photo=await compressPhoto(file);
          if(gallery==='baseline') photo.conditionIds=[];
          activeProject().photoGalleries[gallery].push(photo);
          if(!persistStateNow('',false)) { activeProject().photoGalleries[gallery].pop(); break; }
          saved++;
        } catch(err) { toast('Photo could not be saved',err.message); }
      }
      e.target.value='';
      render();
      if(saved) toast('Photos added',`${saved} ${saved===1?'photo was':'photos were'} saved locally to this section.`);
    }
    if(e.target.matches('[data-gallery-replace]') && e.target.files[0]){
      const gallery=e.target.dataset.galleryReplace;
      const index=activeProject().photoGalleries[gallery].findIndex(photo=>photo.id===e.target.dataset.photoId);
      if(index>=0){
        const original=activeProject().photoGalleries[gallery][index];
        try {
          const replacement=await compressPhoto(e.target.files[0]);
          replacement.id=original.id;
          replacement.caption=original.caption;
          replacement.conditionIds=original.conditionIds;
          activeProject().photoGalleries[gallery][index]=replacement;
          if(!persistStateNow('',false)) activeProject().photoGalleries[gallery][index]=original;
          else toast('Photo replaced','The replacement was saved locally.');
          render();
        } catch(err) { toast('Photo could not be replaced',err.message); }
      }
    }
    if(e.target.id==='projectImageInput' && e.target.files[0]){
      try {
        await prepareProjectImage(e.target.files[0]);
      } catch(err) {
        toast('Image could not be added',err.message);
      } finally {
        e.target.value='';
      }
    }
  });

  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();commandModal();}
    if(e.key==='Escape'&&!$('#modalBackdrop').hidden) closeModal();
  });

  window.addEventListener('hashchange',()=>{ const id=location.hash.replace('#',''); if(sectionDefs.some(s=>s.id===id)){activeSection=id;render();} });
  $('#modalClose').addEventListener('click',closeModal);

  if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateProjectChrome(); render();
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('/sw.js').catch(()=>{});

}
