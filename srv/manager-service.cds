using vacation from '../db/schema';

service ManagerService @(path: '/manage') {
    @Capabilities: {
        Readable,
        Updatable,
    }
    entity Requests as projection on vacation.Requests;

    action   updateRequest(request : String, action : String) returns String;
    function getRequest(request : String)                     returns Requests;
}
