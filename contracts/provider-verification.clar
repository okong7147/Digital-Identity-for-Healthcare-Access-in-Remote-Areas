;; Provider Verification Contract
;; Validates legitimate healthcare workers

(define-data-var admin principal tx-sender)

;; Data structure for healthcare providers
(define-map providers
  { provider-id: (string-ascii 36) }
  {
    name: (string-ascii 100),
    specialty: (string-ascii 100),
    license-number: (string-ascii 50),
    is-verified: bool,
    created-at: uint,
    updated-at: uint
  }
)

;; Track provider IDs by principal
(define-map provider-principals
  { owner: principal }
  { provider-id: (string-ascii 36) }
)

;; Create a new provider
(define-public (register-provider (provider-id (string-ascii 36))
                                 (name (string-ascii 100))
                                 (specialty (string-ascii 100))
                                 (license-number (string-ascii 50)))
  (let ((current-time (get-block-info? time (- block-height u1))))
    (if (is-none (map-get? providers { provider-id: provider-id }))
      (begin
        (map-set providers
          { provider-id: provider-id }
          {
            name: name,
            specialty: specialty,
            license-number: license-number,
            is-verified: false, ;; Initially not verified
            created-at: (default-to u0 current-time),
            updated-at: (default-to u0 current-time)
          }
        )
        (map-set provider-principals
          { owner: tx-sender }
          { provider-id: provider-id }
        )
        (ok true)
      )
      (err u403) ;; Provider ID already exists
    )
  )
)

;; Verify a provider (admin only)
(define-public (verify-provider (provider-id (string-ascii 36)))
  (let ((current-time (get-block-info? time (- block-height u1)))
        (provider-data (map-get? providers { provider-id: provider-id })))
    (if (is-eq tx-sender (var-get admin))
      (if (is-some provider-data)
        (begin
          (map-set providers
            { provider-id: provider-id }
            {
              name: (get name (unwrap-panic provider-data)),
              specialty: (get specialty (unwrap-panic provider-data)),
              license-number: (get license-number (unwrap-panic provider-data)),
              is-verified: true,
              created-at: (get created-at (unwrap-panic provider-data)),
              updated-at: (default-to u0 current-time)
            }
          )
          (ok true)
        )
        (err u404)) ;; Provider not found
      (err u401) ;; Unauthorized
    )
  )
)

;; Check if a provider is verified
(define-read-only (is-verified-provider (provider-id (string-ascii 36)))
  (let ((provider-data (map-get? providers { provider-id: provider-id })))
    (if (is-some provider-data)
      (ok (get is-verified (unwrap-panic provider-data)))
      (ok false)
    )
  )
)

;; Get provider information
(define-read-only (get-provider (provider-id (string-ascii 36)))
  (map-get? providers { provider-id: provider-id })
)

;; Get provider ID by principal
(define-read-only (get-provider-id-by-principal (owner principal))
  (map-get? provider-principals { owner: owner })
)
