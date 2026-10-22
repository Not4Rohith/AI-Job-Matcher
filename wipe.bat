cd backend
call apache-maven-3.9.6\bin\mvn.cmd flyway:clean -Dflyway.url="jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require" -Dflyway.user="postgres.leicmuzgwkyastoevaff" -Dflyway.password="KRhyULk6iZa009QS"
call apache-maven-3.9.6\bin\mvn.cmd spring-boot:run -Dspring-boot.run.profiles=local
