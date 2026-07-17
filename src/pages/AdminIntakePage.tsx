import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Siren, UserPlus } from 'lucide-react'
import { useClinic } from '../store/clinicStore'
import type { Acuity, ArrivalMode, Patient, Vitals } from '../state/types'
import { emptyPatientProfile, emptyVitals } from '../state/types'
import { nextPatientId } from '../utils/ids'

const COMPLAINT_PRESETS = [
  'Chest discomfort',
  'Shortness of breath',
  'Abdominal pain',
  'Fever and cough',
  'Headache / migraine',
  'Dizziness / syncope',
  'Laceration / wound check',
  'Follow-up hypertension',
  'Back pain',
  'Allergic reaction',
] as const

const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm'
const labelClass = 'block text-xs font-medium text-slate-600'
const legendClass = 'mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500'

type IntakeMode = 'full' | 'quick'

function ageFromDob(dob: string): number {
  if (!dob) return 0
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - born.getFullYear()
  const m = today.getMonth() - born.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age -= 1
  return age > 0 ? age : 0
}

function loadFromPatient(p: Patient) {
  return {
    name: p.name,
    preferredName: p.preferredName ?? '',
    age: p.age ? String(p.age) : '',
    dateOfBirth: p.dateOfBirth ?? '',
    sex: p.sex ?? '',
    phone: p.phone ?? '',
    email: p.email ?? '',
    address: p.address ?? '',
    preferredLanguage: p.preferredLanguage || 'English',
    emergencyName: p.emergencyName ?? '',
    emergencyPhone: p.emergencyPhone ?? '',
    emergencyRelation: p.emergencyRelation ?? '',
    insuranceProvider: p.insuranceProvider ?? '',
    insuranceId: p.insuranceId ?? '',
    referringSource: p.referringSource ?? '',
    arrivalMode: (p.arrivalMode || 'walk-in') as ArrivalMode,
    reason: p.reason ?? '',
    symptomOnset: p.symptomOnset ?? '',
    symptomDuration: p.symptomDuration ?? '',
    painScore: p.painScore ?? '',
    allergies: p.allergies ?? '',
    medications: p.medications ?? '',
    pastMedicalHistory: p.pastMedicalHistory ?? '',
    notes: p.notes ?? '',
    vitals: { ...emptyVitals(), ...p.vitals },
    acuity: p.acuity,
    roomId: p.roomId ?? '',
    placement: (p.roomId ? 'room' : 'waiting') as 'waiting' | 'room',
  }
}

export function AdminIntakePage({ embedded = false }: { embedded?: boolean }) {
  const { patientId: editPatientId } = useParams<{ patientId?: string }>()
  const { state, dispatch, isAdminView } = useClinic()
  const navigate = useNavigate()
  const profileDefaults = emptyPatientProfile()
  const editingPatient = editPatientId
    ? state.patients.find((p) => p.id === editPatientId && !p.visitComplete)
    : undefined
  const isEdit = Boolean(editPatientId)

  const [mode, setMode] = useState<IntakeMode>('full')
  const [name, setName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [age, setAge] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [sex, setSex] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState(profileDefaults.preferredLanguage)
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyRelation, setEmergencyRelation] = useState('')
  const [insuranceProvider, setInsuranceProvider] = useState('')
  const [insuranceId, setInsuranceId] = useState('')
  const [referringSource, setReferringSource] = useState('')
  const [arrivalMode, setArrivalMode] = useState<ArrivalMode>('walk-in')
  const [reason, setReason] = useState('')
  const [symptomOnset, setSymptomOnset] = useState('')
  const [symptomDuration, setSymptomDuration] = useState('')
  const [painScore, setPainScore] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medications, setMedications] = useState('')
  const [pastMedicalHistory, setPastMedicalHistory] = useState('')
  const [notes, setNotes] = useState('')
  const [placement, setPlacement] = useState<'waiting' | 'room'>('waiting')
  const [roomId, setRoomId] = useState(state.rooms.find((r) => r.status === 'available')?.id ?? '')
  const [vitals, setVitals] = useState<Vitals>(emptyVitals())
  const [acuity, setAcuity] = useState<Acuity>('routine')
  const [hydratedEditId, setHydratedEditId] = useState<string | null>(null)

  useEffect(() => {
    if (!editingPatient) return
    if (hydratedEditId === editingPatient.id) return
    const loaded = loadFromPatient(editingPatient)
    setMode('full')
    setName(loaded.name)
    setPreferredName(loaded.preferredName)
    setAge(loaded.age)
    setDateOfBirth(loaded.dateOfBirth)
    setSex(loaded.sex)
    setPhone(loaded.phone)
    setEmail(loaded.email)
    setAddress(loaded.address)
    setPreferredLanguage(loaded.preferredLanguage)
    setEmergencyName(loaded.emergencyName)
    setEmergencyPhone(loaded.emergencyPhone)
    setEmergencyRelation(loaded.emergencyRelation)
    setInsuranceProvider(loaded.insuranceProvider)
    setInsuranceId(loaded.insuranceId)
    setReferringSource(loaded.referringSource)
    setArrivalMode(loaded.arrivalMode)
    setReason(loaded.reason)
    setSymptomOnset(loaded.symptomOnset)
    setSymptomDuration(loaded.symptomDuration)
    setPainScore(loaded.painScore)
    setAllergies(loaded.allergies)
    setMedications(loaded.medications)
    setPastMedicalHistory(loaded.pastMedicalHistory)
    setNotes(loaded.notes)
    setVitals(loaded.vitals)
    setAcuity(loaded.acuity)
    setRoomId(loaded.roomId)
    setPlacement(loaded.placement)
    setHydratedEditId(editingPatient.id)
  }, [editingPatient, hydratedEditId])

  useEffect(() => {
    if (isEdit || mode !== 'quick') return
    setAcuity((a) => (a === 'routine' ? 'urgent' : a))
    setPlacement('room')
    const free = state.rooms.find((r) => r.status === 'available')
    if (free) setRoomId(free.id)
  }, [mode, isEdit, state.rooms])

  const availableRooms = state.rooms.filter(
    (r) =>
      r.status !== 'cleaning' &&
      !state.patients.some((p) => p.roomId === r.id && !p.visitComplete),
  )
  const showQuick = !isEdit && mode === 'quick'
  const showFull = isEdit || mode === 'full'

  const summary = useMemo(() => {
    const bits = [
      name.trim() || 'Unnamed patient',
      age || (dateOfBirth ? `DOB ${dateOfBirth}` : null),
      sex || null,
      reason.trim() || null,
      acuity,
      allergies.trim() ? `Allergies: ${allergies.trim()}` : null,
      painScore ? `Pain ${painScore}/10` : null,
      arrivalMode || null,
      isEdit
        ? editingPatient?.roomId
          ? `in room (locked)`
          : 'waiting (locked)'
        : showQuick
          ? `→ room now (chart later)`
          : placement === 'waiting'
            ? '→ waiting list'
            : `→ ${roomId}`,
    ].filter(Boolean)
    return bits.join(' · ')
  }, [
    name,
    age,
    dateOfBirth,
    sex,
    reason,
    acuity,
    allergies,
    painScore,
    arrivalMode,
    placement,
    roomId,
    isEdit,
    showQuick,
    editingPatient?.roomId,
  ])

  function handleDobChange(value: string) {
    setDateOfBirth(value)
    const computed = ageFromDob(value)
    if (computed > 0) setAge(String(computed))
  }

  function intakePayload() {
    const resolvedAge = Number(age) || ageFromDob(dateOfBirth) || 0
    return {
      name: name.trim(),
      preferredName: preferredName.trim(),
      age: resolvedAge,
      dateOfBirth,
      sex,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      emergencyName: emergencyName.trim(),
      emergencyPhone: emergencyPhone.trim(),
      emergencyRelation: emergencyRelation.trim(),
      preferredLanguage: preferredLanguage.trim() || 'English',
      insuranceProvider: insuranceProvider.trim(),
      insuranceId: insuranceId.trim(),
      referringSource: referringSource.trim(),
      arrivalMode,
      reason: reason.trim() || (showQuick ? 'Urgent — details pending' : 'General visit'),
      symptomOnset: symptomOnset.trim(),
      symptomDuration: symptomDuration.trim(),
      painScore: painScore.trim(),
      allergies: allergies.trim() || (showQuick ? '' : 'NKDA'),
      medications: medications.trim(),
      pastMedicalHistory: pastMedicalHistory.trim(),
      vitals,
      notes: notes.trim(),
      acuity,
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAdminView) return
    if (!name.trim()) return

    if (isEdit && editingPatient) {
      dispatch({
        type: 'COMPLETE_INTAKE',
        payload: { patientId: editingPatient.id, ...intakePayload() },
      })
      navigate(editingPatient.roomId ? '/admin/demo' : '/admin/patients')
      return
    }

    if (showQuick) {
      if (!roomId) return
      const id = nextPatientId(state.patients.map((p) => p.id))
      dispatch({
        type: 'ADMIT_PATIENT',
        payload: {
          id,
          ...intakePayload(),
          arrivalMode: arrivalMode || 'walk-in',
          roomId,
          chartIncomplete: true,
        },
      })
      navigate(`/room/${roomId}`, {
        state: { quickUrgentPlaced: true },
      })
      return
    }

    if (placement === 'room' && !roomId) return
    const id = nextPatientId(state.patients.map((p) => p.id))
    const assignedRoom = placement === 'waiting' ? null : roomId
    dispatch({
      type: 'ADMIT_PATIENT',
      payload: {
        id,
        ...intakePayload(),
        roomId: assignedRoom,
        chartIncomplete: false,
      },
    })
    navigate(assignedRoom ? '/admin/demo' : '/admin/patients')
  }

  if (isEdit && !editingPatient) {
    return <Navigate to="/admin/patients" replace />
  }

  return (
    <div className={embedded ? 'space-y-4' : 'mx-auto max-w-5xl space-y-4'}>
      {!embedded && (
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {isEdit ? `Complete chart · ${editingPatient?.name}` : 'Admin Intake'}
          </h1>
          <p className="text-sm text-slate-500">
            {isEdit
              ? 'Finish remaining intake details. Placement stays as-is.'
              : 'Full chart for routine admits, or Quick urgent to seat a patient in a room now and finish details later.'}
            {!isAdminView && (
              <span className="ml-1 text-amber-700">
                (Switch Viewing as to Admin for the Admin menu.)
              </span>
            )}
          </p>
          {!isEdit && (
            <p
              className={`mt-1 text-xs font-medium ${
                state.agentAssignEnabled !== false ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              Waiting-list assignments are {state.agentAssignEnabled !== false ? 'active' : 'paused'} ·{' '}
              <Link to="/admin/demo" className="underline">
                manage Demo Agent
              </Link>
            </p>
          )}
        </div>
      )}

      {isEdit && editingPatient?.chartIncomplete && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Finish remaining intake details for this quick urgent admit.
          {editingPatient.roomId && (
            <>
              {' '}
              <Link
                to={`/room/${editingPatient.roomId}`}
                className="font-medium underline"
              >
                View room
              </Link>
            </>
          )}
        </div>
      )}

      {!isEdit && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('full')
              setAcuity('routine')
              setPlacement('waiting')
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'full'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            Full chart
          </button>
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'quick'
                ? 'bg-rose-700 text-white'
                : 'border border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <Siren className="h-4 w-4" />
            Quick urgent
          </button>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Chart preview
        </span>
        <p className="mt-1">{summary}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        {showQuick && (
          <>
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className={legendClass}>Quick urgent — room now</legend>
              <p className="sm:col-span-2 text-sm text-slate-600">
                Minimal fields only. Patient goes straight into a room; complete the full chart
                whenever you can.
              </p>
              <label className={`${labelClass} sm:col-span-2`}>
                Name *
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Patient name"
                  autoFocus
                />
              </label>
              <label className={labelClass}>
                Acuity
                <select
                  value={acuity}
                  onChange={(e) => setAcuity(e.target.value as Acuity)}
                  className={inputClass}
                >
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className={labelClass}>
                Room *
                <select
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className={inputClass}
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.status})
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2 space-y-2">
                <p className={labelClass}>Chief complaint (optional)</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMPLAINT_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className={`rounded-md border px-2 py-1 text-xs ${
                        reason === preset
                          ? 'border-rose-700 bg-rose-50 text-rose-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputClass}
                  placeholder="Or type reason — defaults to “Urgent — details pending”"
                />
              </div>
              <label className={`${labelClass} sm:col-span-2`}>
                One-line note (optional)
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. EMS arrival, unstable, needs doctor ASAP"
                />
              </label>
            </fieldset>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-rose-700 px-3 py-2.5 text-sm font-medium text-white hover:bg-rose-800 sm:w-auto"
            >
              <Siren className="h-4 w-4" />
              Place in room now
            </button>
          </>
        )}

        {showFull && (
          <>
            <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <legend className={legendClass}>Identity</legend>
              <label className={`${labelClass} sm:col-span-2 lg:col-span-2`}>
                Legal name *
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Full name as on ID"
                />
              </label>
              <label className={labelClass}>
                Preferred name
                <input
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  className={inputClass}
                  placeholder="Goes by"
                />
              </label>
              <label className={labelClass}>
                Date of birth
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Age
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={inputClass}
                  placeholder="Auto from DOB"
                />
              </label>
              <label className={labelClass}>
                Sex
                <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputClass}>
                  <option value="">Not specified</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="intersex">Intersex</option>
                  <option value="prefer_not">Prefer not to say</option>
                </select>
              </label>
              <label className={labelClass}>
                Preferred language
                <input
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className={inputClass}
                  list="intake-languages"
                />
                <datalist id="intake-languages">
                  <option value="English" />
                  <option value="Spanish" />
                  <option value="Mandarin" />
                  <option value="Cantonese" />
                  <option value="Vietnamese" />
                  <option value="Arabic" />
                  <option value="ASL / interpreter" />
                </datalist>
              </label>
            </fieldset>

            <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <legend className={legendClass}>Contact</legend>
              <label className={labelClass}>
                Phone
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="555-0100"
                />
              </label>
              <label className={labelClass}>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
                Address
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                  placeholder="Street, city"
                />
              </label>
            </fieldset>

            <fieldset className="grid gap-3 sm:grid-cols-3">
              <legend className={legendClass}>Emergency contact</legend>
              <label className={labelClass}>
                Name
                <input
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Phone
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Relationship
                <input
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className={inputClass}
                  placeholder="Spouse, parent…"
                  list="intake-relations"
                />
                <datalist id="intake-relations">
                  <option value="Spouse" />
                  <option value="Partner" />
                  <option value="Parent" />
                  <option value="Child" />
                  <option value="Sibling" />
                  <option value="Friend" />
                  <option value="Caregiver" />
                </datalist>
              </label>
            </fieldset>

            <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <legend className={legendClass}>Coverage & arrival</legend>
              <label className={labelClass}>
                Insurance provider
                <input
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Member / policy ID
                <input
                  value={insuranceId}
                  onChange={(e) => setInsuranceId(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Referring source
                <input
                  value={referringSource}
                  onChange={(e) => setReferringSource(e.target.value)}
                  className={inputClass}
                  placeholder="PCP, EMS, urgent care…"
                />
              </label>
              <label className={labelClass}>
                Arrival mode
                <select
                  value={arrivalMode}
                  onChange={(e) => setArrivalMode(e.target.value as ArrivalMode)}
                  className={inputClass}
                >
                  <option value="walk-in">Walk-in</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="referral">Referral</option>
                  <option value="ambulance">Ambulance</option>
                  <option value="transfer">Transfer</option>
                  <option value="">Unknown</option>
                </select>
              </label>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className={legendClass}>Chief complaint & symptoms</legend>
              <div className="flex flex-wrap gap-1.5">
                {COMPLAINT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className={`rounded-md border px-2 py-1 text-xs ${
                      reason === preset
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <label className={labelClass}>
                Reason for visit *
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputClass}
                  placeholder="Chief complaint in patient’s words"
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className={labelClass}>
                  Symptom onset
                  <input
                    value={symptomOnset}
                    onChange={(e) => setSymptomOnset(e.target.value)}
                    className={inputClass}
                    placeholder="When it started"
                  />
                </label>
                <label className={labelClass}>
                  Duration
                  <input
                    value={symptomDuration}
                    onChange={(e) => setSymptomDuration(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 3 hours, 2 days"
                  />
                </label>
                <label className={labelClass}>
                  Pain score (0–10)
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={painScore}
                    onChange={(e) => setPainScore(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className={legendClass}>Clinical history</legend>
              <label className={`${labelClass} sm:col-span-2`}>
                Allergies
                <input
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className={inputClass}
                  placeholder="NKDA or list drug / food / latex reactions"
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Current medications
                <textarea
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className={`${inputClass} min-h-[72px]`}
                  placeholder="Drug, dose, frequency"
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Past medical / surgical history
                <textarea
                  value={pastMedicalHistory}
                  onChange={(e) => setPastMedicalHistory(e.target.value)}
                  className={`${inputClass} min-h-[72px]`}
                  placeholder="Chronic conditions, surgeries, hospitalizations"
                />
              </label>
            </fieldset>

            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className={legendClass}>Triage</legend>
              <label className={labelClass}>
                Acuity
                <select
                  value={acuity}
                  onChange={(e) => setAcuity(e.target.value as Acuity)}
                  className={inputClass}
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className={`${labelClass} sm:row-span-2`}>
                Intake / chart notes
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputClass} min-h-[88px]`}
                  placeholder="Triage observations, isolation flags, interpreter needed…"
                />
              </label>
            </fieldset>

            {!isEdit && (
              <fieldset className="space-y-3">
                <legend className={legendClass}>Placement</legend>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPlacement('waiting')}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      placement === 'waiting'
                        ? 'bg-amber-700 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Waiting list (default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlacement('room')}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      placement === 'room'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Assign room now
                  </button>
                </div>
                {placement === 'room' && (
                  <label className={labelClass}>
                    Room
                    <select
                      required
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className={inputClass}
                    >
                      {availableRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.status})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </fieldset>
            )}

            {isEdit && (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Placement locked:{' '}
                {editingPatient?.roomId
                  ? state.rooms.find((r) => r.id === editingPatient.roomId)?.name ??
                    editingPatient.roomId
                  : 'Waiting list'}
              </p>
            )}

            <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <legend className={legendClass}>Vitals (optional at intake)</legend>
              {(
                [
                  ['bloodPressure', 'Blood pressure', 'e.g. 120/80'],
                  ['heartRate', 'Heart rate', 'bpm'],
                  ['respiratoryRate', 'Respiratory rate', 'breaths/min'],
                  ['spo2', 'SpO₂ %', 'e.g. 98'],
                  ['temperature', 'Temperature', 'e.g. 37.0°C'],
                  ['height', 'Height', 'e.g. 170 cm'],
                  ['weight', 'Weight', 'e.g. 70 kg'],
                ] as const
              ).map(([key, label, placeholder]) => (
                <label key={key} className={labelClass}>
                  {label}
                  <input
                    value={vitals[key]}
                    onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                    className={inputClass}
                    placeholder={placeholder}
                  />
                </label>
              ))}
            </fieldset>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 sm:w-auto"
            >
              <UserPlus className="h-4 w-4" />
              {isEdit
                ? 'Save completed chart'
                : placement === 'waiting'
                  ? 'Add to waiting list'
                  : 'Admit to room'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
