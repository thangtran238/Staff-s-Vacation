using vacation from '../db/schema';

service ManagerService @(path: '/manage') {
    view RequestsResponse as
        select
            reason,
            status,
            startDay,
            endDay,
            user,
            role,
            department,
            Requests.ID as request_id
        from vacation.Requests
        right outer join vacation.Users
            on Requests.user.ID = Users.ID
        where
            Requests.user.ID = Users.ID;

    entity Requests         as projection on vacation.Requests; 
    entity Users            as projection on vacation.Users;
    entity Departments      as projection on vacation.Departments;
    action createDepartment(departmentName : String)                     returns String;
    action inviteMember(department : Integer, members : array of String) returns String;
    action updateRequest(request : String, action : String)              returns String;
// function getRequest(request : String)                                  returns Requests;
}
