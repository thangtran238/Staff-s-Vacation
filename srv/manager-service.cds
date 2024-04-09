using vacation from '../db/schema';

service ManagerService @(path: '/manage') {
    @Capabilities: {
        Readable,
        Updatable,
    }
    entity Requests    as projection on vacation.Requests;

    entity Departments as projection on vacation.Departments;
    action   createDepartment(departmentName : String)          returns String;
    action   inviteMember(department : String, member : String) returns Departments;
    action   updateRequest(request : String, action : String)   returns String;
    function getRequest(request : String)                       returns Requests;
}
