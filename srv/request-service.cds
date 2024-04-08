using vacation from '../db/schema';


service RequestService @(path: '/request') {
    entity Requests as projection on vacation.Requests;
    function calculateTotalDayOff(user_id : Integer) returns Decimal(10, 2)
}
