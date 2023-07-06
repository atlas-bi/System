# Generate Random LDAP Users

```bash
poetry install
poetry run python user_generator.py
```

copy the `config.ldif` file to `config/config.ldif`

# Browsing LDAP

1. start up the ldap server `npm run dev:ldap`

**Listing all users**

```sh
ldapsearch -x -h localhost -b "dc=example,dc=org" -D "cn=admin,dc=example,dc=org" -w "adminpassword"
```

**Search for class**

```sh
ldapsearch -x -LLL -h localhost -D cn=admin,dc=example,dc=org -w adminpassword -b"dc=example,dc=org" -s sub "(objectClass=inetOrgPerson)" <optionally only get attribute>
```

**Search by field**

```sh
ldapsearch -x -LLL -h localhost -D cn=admin,dc=example,dc=org -w adminpassword -b"dc=example,dc=org" -s sub "(objectClass=inetOrgPerson)" <optionally only get attribute>
```
