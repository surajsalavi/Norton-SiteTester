ALTER TABLE `crawling`.`machines` ADD COLUMN `nortonenabled` BIT(1) NULL DEFAULT 0 AFTER `clustersize`;

ALTER TABLE `crawling`.`machines` ADD COLUMN `nortonlastcommdatetime` VARCHAR(45) NULL AFTER `nortontenabled`;

create table crawling.nortonerrorlog like crawling.errorlog;

ALTER TABLE `crawling`.`machines` ADD COLUMN `nortoniserroroccured` BIT(1) NULL DEFAULT 0 AFTER `nortonlastcommdatetime`;

ALTER TABLE `crawling`.`machines` ADD COLUMN `nortonclustersize` INT NULL DEFAULT 1 AFTER `nortoniserroroccured`;

ALTER TABLE `crawling`.`machines` ADD COLUMN `nortonbatchsize` INT NULL DEFAULT 10 AFTER `nortonclustersize`;



ALTER TABLE `crawling`.`domains` ADD COLUMN `nortonstarttime` DATETIME NULL AFTER `nortonstatusid`;
ALTER TABLE `crawling`.`domains` ADD COLUMN `nortonendtime` DATETIME NULL AFTER `nortonstarttime`;


USE `crawling`;
DROP procedure IF EXISTS `nortongetdomains`;

USE `crawling`;
DROP procedure IF EXISTS `crawling`.`nortongetdomains`;
;

DELIMITER $$
USE `crawling`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `nortongetdomains`(IN pmachinecode varchar(45))
BEGIN

declare ismachineenabled int;
declare tclustersize int;
declare tbatchsize int;
declare terrormessage text default '';

DECLARE EXIT HANDLER FOR SQLEXCEPTION 
BEGIN
     GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, 
	 @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
	 SET @full_error = CONCAT("ERROR ", @errno, " (", @sqlstate, "): ", @text);
     select @full_error into terrormessage;
     
	 insert into nortonerrorlog(machinecode,errormessage,errorsourceid) values('SERVER-SP-ERR',terrormessage,1);
     commit;
END;

START TRANSACTION;

	update machines set nortonlastcommdatetime=CURRENT_TIME() where machinecode=pmachinecode;
	select count(id) into ismachineenabled from machines where machinecode=pmachinecode and nortonenabled=1 and nortoniserroroccured=0;
	
	if ismachineenabled>0
	THEN
        select nortonbatchsize into tbatchsize from machines where machinecode=pmachinecode;
        
		CREATE TEMPORARY TABLE t_table (id INT,domain VARCHAR(150) );
		insert into t_table (SELECT id, domain FROM domains WHERE nortonstatusid is NULL LIMIT tbatchsize FOR UPDATE);
		UPDATE domains SET machinecode=pmachinecode,nortonstatusid = 0,nortonstarttime=CURRENT_TIME() WHERE id IN (SELECT id FROM t_table);
        -- select * from tmp_table;
        
		select nortonclustersize into tclustersize from machines where machinecode=pmachinecode;
        select JSON_OBJECT('ismachineenabled',ismachineenabled,'clustersize',tclustersize,'domains',(select json_arrayagg(json_object('id',id,'domain',domain)) from t_table)) as details;
	 else
	     select JSON_OBJECT('ismachineenabled',ismachineenabled) as details;
	END IF;
    
    drop temporary table if exists t_table;
	commit; 
END$$

DELIMITER ;
;




