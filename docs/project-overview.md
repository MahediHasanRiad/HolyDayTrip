# HolyDayTrip Project Overview

## Purpose

HolyDayTrip is a planned weekend-hotel marketplace API. It will help hotel owners publish properties, rooms, and weekend-only offers, while customers browse and compare offers before submitting a reservation request.

The project currently runs as an Express monitoring/API starter. The HolyDayTrip capabilities are defined in the approved OpenSpec change but are not implemented yet.

## Users and Core Journey

| User | Goal | Planned journey |
| --- | --- | --- |
| Hotel owner | Showcase a hotel and attract weekend guests | Create an owner profile, add a hotel, add rooms, then publish a weekend offer. |
| Customer | Find and request a suitable weekend stay | Browse or filter offers, compare selected hotels, and submit a reservation request for one offer. |

```text
Owner profile → Hotel → Room → Weekend offer
                                      ↓
Customer browse/filter → Compare offers → Booking request (pending)
```

## Planned Product Capabilities

### Hotel owner listings

- Create and retrieve hotel-owner profiles.
- Create hotel listings with a name, location, description, and owner reference.
- Add rooms with a name, positive capacity, and amenities.

### Weekend hotel offers

- Create an offer for an existing room with price, currency, and stay dates.
- Limit stays to Friday or Saturday check-in and checkout no later than the following Monday.
- Browse offers and filter them by location or check-in date.
- Compare selected offers using consistent hotel, room, price, currency, and date information.

### Booking requests

- Submit a reservation request with customer name and contact email for an existing offer.
- Create each request with a `pending` status.
- Preserve a snapshot of the selected hotel, room, price, currency, and stay dates in the reservation.
- Retrieve an existing reservation request by ID.

## Planned API Contract

All HolyDayTrip endpoints will be JSON endpoints under `/api/v1`.

| Area | Planned operations |
| --- | --- |
| Owners | Create and retrieve owner profiles |
| Hotels and rooms | Create hotels for owners; add rooms to hotels; retrieve hotel details |
| Offers | Create weekend offers; browse/filter offers; compare selected offers |
| Reservations | Create and retrieve pending booking requests |

The API will validate input before changing in-memory data and consistently use:

- `200` for successful reads
- `201` for successful creates
- `400` for invalid input
- `404` for missing records

## Technical Approach

The API is bootstrapped as a Docker-based Express service with PostgreSQL accessed through Prisma and Redis for ephemeral concerns. Its persistent record relationships are:

```text
Owner → Hotel → Room → Offer → Booking request
```

The initial Prisma migration defines these records, foreign keys, query indexes, and database constraints for capacity, pricing, currency format, and weekend stay windows. The final JSON 404 handler remains the last application handler.

## Current Project State

Currently available service endpoints are:

- `GET /health`
- `GET /ready`

Run it locally with Docker Compose as documented in the project README.

## Current Limitations and Deliberate Non-Goals

- A `pending` booking request does not reserve inventory or prevent duplicate requests.
- Authentication, authorization, payments, booking approval, cancellation, notifications, persistence, and a web UI are outside the first release.

## Source Plans

The implementation-ready OpenSpec artifacts are located in [`openspec/changes/create-holiday-trip-platform`](../openspec/changes/create-holiday-trip-platform/):

- [`proposal.md`](../openspec/changes/create-holiday-trip-platform/proposal.md)
- [`design.md`](../openspec/changes/create-holiday-trip-platform/design.md)
- [`tasks.md`](../openspec/changes/create-holiday-trip-platform/tasks.md)
