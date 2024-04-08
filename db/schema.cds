namespace vacation;

using {
    cuid,
    managed
} from '@sap/cds/common';

type Role   : String enum {
    staff;
    manager;
}

type Status : String enum {
    pending;
    accepted;
    rejected;
}

entity Users : cuid, managed {
    username     : String;
    password     : String;
    fullname     : String;
    isActive     : Boolean default 'true';
    address      : String;
    role         : Role default 'staff';
    refreshToken : String;
    totalDayOff  : Decimal(10, 2);
    requests     : Association to many Requests
                       on requests.user = $self;
    departments  : Association to Departments;
}

entity Requests : cuid, managed {
    status   : Status default 'pending';
    reason   : String;
    user     : Association to Users;
    startDay : Date;
    endDay   : Date;
}

entity Departments : cuid, managed {
    name    : String;
    members : Association to many Users
                  on members.departments = $self;

}
