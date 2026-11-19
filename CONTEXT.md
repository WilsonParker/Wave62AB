# Wave62AB

A single Chrome extension for customer-service staff on Inditex apps, combining the ALMA FESHLL language helper (Wave62A) and the BICO Order Assistant (Wave62B).

## Language

**ALMA**:
The Inditex FESHLL app under `/almafeshll/`. Only the language setting applies to it.
_Avoid_: FESHLL (use only when quoting the app's full name)

**BICO**:
The Inditex order-management app under `/bico/`. Gets both the language setting and the Panel.

**Language setting**:
The preferred display language written to the app's `locale` cookie. Stored separately per app: ALMA uses a region code (`ko-KR`), BICO uses the bare code (`ko`).
_Avoid_: Locale (that is the cookie's name, not the setting)

**Panel**:
The floating "BICO 도우미" box shown on a BICO order page. It can be turned on or off from the Popup.
_Avoid_: Widget

**Popup**:
The extension's toolbar settings window: one screen with an ALMA section and a BICO section.
_Avoid_: Panel

**Section**:
One titled, minimisable block inside the Panel. Currently only the Cases section exists.
_Avoid_: Card, tab

**Case**:
A customer-service ticket recorded against an order in BICO.
_Avoid_: Ticket, issue

**SUBTYPE code**:
The leading four-digit code of a Case's subtype (for example 0906), used to group Cases.

**Cases summary**:
The count of Cases per SUBTYPE code for one order over the last year, shown in the Cases section.
