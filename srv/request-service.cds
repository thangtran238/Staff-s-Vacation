using vacation from '../db/schema';
service RequestService @(path: '/request') {
    entity Requesst as projection on vacation.Requests;
}
