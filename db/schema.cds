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
    fname        : String;
    isActive     : Boolean default true;
    address      : String;
    role         : Role default 'staff';
    refreshToken : String;
    dayOffThisYear  : Decimal(10, 2) default 0;
    dayOffLastYear  : Decimal(10, 2) default 0;
    requests     : Association to many Requests
                       on requests.user = $self;
    department   : Association to one Departments;
}

entity Requests : cuid, managed {
    status   : Status default 'pending';
    reason   : String;
    user     : Association to Users;
    startDay : Date;
    endDay   : Date;
    isOutofDay: Boolean default 'false';
}


entity Notifications : cuid, managed {
    sender    : Association to Users
                    on sender.ID;
    receivers : Association to many Users
                    on receivers.ID;
    message   : String;
    read      : Boolean default 'false';
}

entity Departments : managed {
    key id             : Integer;
        departmentName : String;
        members        : Association to many Users
                             on members.department = $self;

}
