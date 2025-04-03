;; Patient Identity Contract
;; Creates portable digital health records

(define-data-var admin principal tx-sender)

;; Data structure for patient identity
(define-map patients
  { patient-id: (string-ascii 36) }
  {
    name: (string-ascii 100),
    dob: (string-ascii 10),
    blood-type: (string-ascii 3),
    allergies: (string-ascii 255),
    emergency-contact: (string-ascii 100),
    created-at: uint,
    updated-at: uint
  }
)

;; Track patient IDs by principal
(define-map patient-principals
  { owner: principal }
  { patient-id: (string-ascii 36) }
)

;; Create a new patient identity
(define-public (create-patient (patient-id (string-ascii 36))
                              (name (string-ascii 100))
                              (dob (string-ascii 10))
                              (blood-type (string-ascii 3))
                              (allergies (string-ascii 255))
                              (emergency-contact (string-ascii 100)))
  (let ((current-time (get-block-info? time (- block-height u1))))
    (if (is-none (map-get? patients { patient-id: patient-id }))
      (begin
        (map-set patients
          { patient-id: patient-id }
          {
            name: name,
            dob: dob,
            blood-type: blood-type,
            allergies: allergies,
            emergency-contact: emergency-contact,
            created-at: (default-to u0 current-time),
            updated-at: (default-to u0 current-time)
          }
        )
        (map-set patient-principals
          { owner: tx-sender }
          { patient-id: patient-id }
        )
        (ok true)
      )
      (err u403) ;; Patient ID already exists
    )
  )
)

;; Update patient information
(define-public (update-patient (patient-id (string-ascii 36))
                              (name (string-ascii 100))
                              (blood-type (string-ascii 3))
                              (allergies (string-ascii 255))
                              (emergency-contact (string-ascii 100)))
  (let ((current-time (get-block-info? time (- block-height u1)))
        (patient-data (map-get? patients { patient-id: patient-id }))
        (patient-principal (map-get? patient-principals { owner: tx-sender })))
    (if (and
          (is-some patient-data)
          (is-some patient-principal)
          (is-eq (get patient-id (default-to { patient-id: "" } patient-principal)) patient-id))
      (begin
        (map-set patients
          { patient-id: patient-id }
          {
            name: name,
            dob: (get dob (unwrap-panic patient-data)),
            blood-type: blood-type,
            allergies: allergies,
            emergency-contact: emergency-contact,
            created-at: (get created-at (unwrap-panic patient-data)),
            updated-at: (default-to u0 current-time)
          }
        )
        (ok true)
      )
      (err u404) ;; Patient not found or unauthorized
    )
  )
)

;; Get patient information
(define-read-only (get-patient (patient-id (string-ascii 36)))
  (map-get? patients { patient-id: patient-id })
)

;; Get patient ID by principal
(define-read-only (get-patient-id-by-principal (owner principal))
  (map-get? patient-principals { owner: owner })
)
